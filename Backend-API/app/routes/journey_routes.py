from flask import Blueprint, request, jsonify
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required
import math

journey_bp = Blueprint('journey', __name__, url_prefix='/api/journey')

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two points using Haversine formula (in meters)"""
    R = 6371000  # Earth radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c
@journey_bp.route('/shortest-path', methods=['POST'])
@jwt_required()
def find_shortest_path():
    try:
        data = request.get_json()
        from_station_id = data.get('from_station_id')
        to_station_id = data.get('to_station_id')
        
        if not from_station_id or not to_station_id:
            return jsonify({"success": False, "error": "Thiếu thông tin trạm"}), 400
            
        if from_station_id == to_station_id:
             return jsonify({"success": False, "error": "Điểm đi và đến trùng nhau"}), 400

        db = db_connection.get_db()

        # --- BƯỚC 1: Lấy ID hệ thống của trạm ---
        print(f"🔍 Đang tìm ID cho: {from_station_id} -> {to_station_id}")
        
        aql_get_ids = """
        LET start = (FOR s IN stations FILTER s.station_id == @from_id LIMIT 1 RETURN s)
        LET end = (FOR s IN stations FILTER s.station_id == @to_id LIMIT 1 RETURN s)
        RETURN { 
            start: start[0], 
            end: end[0] 
        }
        """
        
        id_result = list(db.AQLQuery(aql_get_ids, bindVars={
            'from_id': from_station_id, 
            'to_id': to_station_id
        }, rawResults=True))
        
        if not id_result or not id_result[0].get('start') or not id_result[0].get('end'):
            return jsonify({"success": False, "error": "Không tìm thấy mã trạm trong hệ thống"}), 404
            
        start_node_id = id_result[0]['start']['_id']
        end_node_id = id_result[0]['end']['_id']
        start_name = id_result[0]['start']['name']
        end_name = id_result[0]['end']['name']

        print(f"📍 Bắt đầu tìm đường: {start_name} ({start_node_id}) ===> {end_name} ({end_node_id})")

        # --- BƯỚC 2: Tìm đường bằng TRAVERSAL (Thay vì Shortest Path) ---
        # Giải thích:
        # 1..50: Tìm trong phạm vi 1 đến 50 trạm dừng (đủ cho nội thành)
        # ANY: Đi bất chấp chiều mũi tên (coi như đường 2 chiều)
        # OPTIONS bfs: true -> Đảm bảo tìm đường ít trạm nhất trước
        
        aql_traversal = """
        FOR v, e, p IN 1..50 ANY @start_node connects
            OPTIONS {bfs: true, uniqueVertices: 'global'}
            FILTER v._id == @end_node
            LIMIT 1
            RETURN {
                vertices: p.vertices,
                edges: p.edges,
                total_distance: SUM(p.edges[*].distance),
                total_duration: SUM(p.edges[*].duration),
                stops: LENGTH(p.edges)
            }
        """

        path_result = list(db.AQLQuery(aql_traversal, bindVars={
            'start_node': start_node_id,
            'end_node': end_node_id
        }, rawResults=True))

        # --- BƯỚC 3: Kiểm tra kết quả ---
        if not path_result:
            print("❌ Không tìm thấy đường nối giữa 2 trạm này.")
            return jsonify({
                "success": False, 
                "error": f"Không có tuyến xe kết nối từ {start_name} đến {end_name}"
            }), 404
            
        journey = path_result[0]
        vertices = journey.get('vertices') or []
        
        print(f"✅ Đã tìm thấy đường! Qua {len(vertices)} trạm.")

        # --- BƯỚC 4: Lấy thông tin Tuyến xe (Route Info) ---
        # Phần này giúp hiển thị Badge "Tuyến 01" trên UI
        routes_found = []
        
        # Chỉ tìm tuyến nếu có ít nhất 2 trạm (có cạnh nối)
        if len(vertices) >= 2:
            try:
                # Lấy 2 trạm đầu tiên để xác định tuyến
                v1 = vertices[0]['_id']
                v2 = vertices[1]['_id']
                
                aql_route = """
                FOR r IN routes
                    LET s1 = (FOR s IN ANY r serves FILTER s._id == @v1 LIMIT 1 RETURN 1)
                    LET s2 = (FOR s IN ANY r serves FILTER s._id == @v2 LIMIT 1 RETURN 1)
                    FILTER LENGTH(s1) > 0 AND LENGTH(s2) > 0
                    LIMIT 1
                    RETURN { 
                        route_code: r.route_code, 
                        route_name: r.route_name 
                    }
                """
                route_res = list(db.AQLQuery(aql_route, bindVars={'v1': v1, 'v2': v2}, rawResults=True))
                if route_res:
                    routes_found.append({"route": route_res[0]})
            except Exception as e:
                print(f"⚠️ Không xác định được tên tuyến: {e}")

        # Chuẩn hóa dữ liệu trả về
        formatted_result = [{
            "type": "graph_path",
            "vertices": vertices,
            "edges": journey.get('edges') or [],
            "total_distance": journey.get('total_distance') or 0,
            "total_duration": journey.get('total_duration') or 0,
            "stops": len(vertices) - 1, # Số trạm dừng = Tổng đỉnh - 1 (đỉnh đầu)
            "routes": routes_found
        }]

        return jsonify({
            "success": True,
            "data": formatted_result
        }), 200

    except Exception as e:
        print(f"❌ Lỗi Server: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
@journey_bp.route('/routes-between', methods=['POST'])
@jwt_required()
def find_routes_between_stations():
    """Find all routes between two stations"""
    try:
        data = request.get_json()
        from_station = data.get('from_station_id')
        to_station = data.get('to_station_id')
        
        if not from_station or not to_station:
            return jsonify({
                "success": False,
                "error": "from_station_id and to_station_id are required"
            }), 400
        
        db = db_connection.get_db()
        
        aql = """
        FOR route IN routes
            LET from_serves = FIRST(
                FOR v, e IN OUTBOUND route serves
                    FILTER v.station_id == @from_station
                    RETURN e
            )
            LET to_serves = FIRST(
                FOR v, e IN OUTBOUND route serves
                    FILTER v.station_id == @to_station
                    RETURN e
            )
            FILTER from_serves != null AND to_serves != null
            FILTER from_serves.stop_order < to_serves.stop_order
            
            LET stops_between = (
                FOR v, e IN OUTBOUND route serves
                    FILTER e.stop_order >= from_serves.stop_order
                    FILTER e.stop_order <= to_serves.stop_order
                    SORT e.stop_order
                    RETURN {
                        station: v,
                        stop_order: e.stop_order
                    }
            )
            
            RETURN {
                route: route,
                from_stop_order: from_serves.stop_order,
                to_stop_order: to_serves.stop_order,
                stops: LENGTH(stops_between),
                stops_details: stops_between
            }
        """
        
        bind_vars = {
            'from_station': from_station,
            'to_station': to_station
        }
        
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        routes = list(result)
        
        return jsonify({
            "success": True,
            "count": len(routes),
            "data": routes
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@journey_bp.route('/nearby-stations', methods=['GET'])
@jwt_required()
def find_nearby_stations():
    """Find stations near a location"""
    try:
        lat = float(request.args.get('latitude'))
        lng = float(request.args.get('longitude'))
        radius = float(request.args.get('radius', 2))  # km
        
        db = db_connection.get_db()
        
        # Simple distance calculation (can be improved with proper geo queries)
        aql = """
        FOR station IN stations
            LET distance = DISTANCE(
                station.location.latitude,
                station.location.longitude,
                @lat,
                @lng
            ) / 1000
            FILTER distance <= @radius
            SORT distance
            RETURN {
                station: station,
                distance: distance
            }
        """
        
        bind_vars = {
            'lat': lat,
            'lng': lng,
            'radius': radius
        }
        
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        stations = list(result)
        
        return jsonify({
            "success": True,
            "count": len(stations),
            "data": stations
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500