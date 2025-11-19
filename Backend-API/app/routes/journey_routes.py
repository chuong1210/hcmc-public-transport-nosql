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
    """Find shortest path between two locations using bus routes"""
    try:
        data = request.get_json()
        from_lat = data.get('from_lat')
        from_lng = data.get('from_lng')
        to_lat = data.get('to_lat')
        to_lng = data.get('to_lng')
        
        if not all([from_lat, from_lng, to_lat, to_lng]):
            return jsonify({
                "success": False,
                "error": "Missing required coordinates"
            }), 400
        
        db = db_connection.get_db()
        
        # Find nearest stations to start and end points
        aql_find_stations = """
        FOR station IN stations
            FILTER station.status == "active"
            LET dist_from = DISTANCE(
                @from_lat, @from_lng,
                station.location.latitude, station.location.longitude
            )
            LET dist_to = DISTANCE(
                @to_lat, @to_lng,
                station.location.latitude, station.location.longitude
            )
            RETURN {
                station: station,
                dist_from: dist_from,
                dist_to: dist_to
            }
        """
        
        result = db.AQLQuery(aql_find_stations, bindVars={
            'from_lat': from_lat,
            'from_lng': from_lng,
            'to_lat': to_lat,
            'to_lng': to_lng
        }, rawResults=True)
        
        stations_data = list(result)
        
        if not stations_data:
            return jsonify({
                "success": False,
                "error": "No stations found"
            }), 404
        
        # Find closest start and end stations
        start_station = min(stations_data, key=lambda x: x['dist_from'])['station']
        end_station = min(stations_data, key=lambda x: x['dist_to'])['station']
        
        print(f"Start station: {start_station['name']}")
        print(f"End station: {end_station['name']}")
        
        # Strategy 1: Try direct route (same route serving both stations)
        aql_direct = """
        FOR route IN routes
            FILTER route.status == "active"
            LET start_serve = FIRST(
                FOR v, e IN OUTBOUND route serves
                    FILTER v.station_id == @start_id
                    RETURN e
            )
            LET end_serve = FIRST(
                FOR v, e IN OUTBOUND route serves
                    FILTER v.station_id == @end_id
                    RETURN e
            )
            FILTER start_serve != null AND end_serve != null
            FILTER start_serve.stop_order < end_serve.stop_order
            
            LET all_stops = (
                FOR v, e IN OUTBOUND route serves
                    FILTER e.stop_order >= start_serve.stop_order
                    FILTER e.stop_order <= end_serve.stop_order
                    SORT e.stop_order
                    RETURN {
                        station: v,
                        stop_order: e.stop_order,
                        arrival_offset: e.arrival_offset
                    }
            )
            
            RETURN {
                type: "direct",
                route: route,
                start_station: @start_station,
                end_station: @end_station,
                stations: all_stops,
                total_stops: LENGTH(all_stops),
                duration: end_serve.arrival_offset - start_serve.arrival_offset
            }
        """
        
        direct_result = db.AQLQuery(aql_direct, bindVars={
            'start_id': start_station['station_id'],
            'end_id': end_station['station_id'],
            'start_station': start_station,
            'end_station': end_station
        }, rawResults=True)
        
        direct_routes = list(direct_result)
        
        if direct_routes:
            # Sort by duration and return best route
            best_route = min(direct_routes, key=lambda x: x['duration'])
            
            # Calculate walking distances
            walk_to_start = calculate_distance(
                from_lat, from_lng,
                start_station['location']['latitude'],
                start_station['location']['longitude']
            )
            
            walk_from_end = calculate_distance(
                to_lat, to_lng,
                end_station['location']['latitude'],
                end_station['location']['longitude']
            )
            
            return jsonify({
                "success": True,
                "data": [{
                    "type": "direct",
                    "route": best_route['route'],
                    "start_station": start_station,
                    "end_station": end_station,
                    "stations": best_route['stations'],
                    "total_stops": best_route['total_stops'],
                    "duration": best_route['duration'],
                    "walk_to_start": round(walk_to_start),
                    "walk_from_end": round(walk_from_end),
                    "total_duration": best_route['duration'] + 5 + 5,  # Add 5 mins walk each
                    "instructions": [
                        f"Đi bộ {round(walk_to_start)}m đến {start_station['name']}",
                        f"Bắt xe buýt tuyến {best_route['route']['route_code']} - {best_route['route']['route_name']}",
                        f"Đi qua {best_route['total_stops']} trạm ({best_route['duration']} phút)",
                        f"Xuống tại {end_station['name']}",
                        f"Đi bộ {round(walk_from_end)}m đến đích"
                    ]
                }]
            }), 200
        
        # Strategy 2: Try transfer route (need to change buses)
        aql_transfer = """
        FOR route1 IN routes
            FILTER route1.status == "active"
            LET start_serve = FIRST(
                FOR v, e IN OUTBOUND route1 serves
                    FILTER v.station_id == @start_id
                    RETURN {station: v, edge: e}
            )
            FILTER start_serve != null
            
            // Find all stations on route1 after start
            FOR transfer_station, e1 IN OUTBOUND route1 serves
                FILTER e1.stop_order > start_serve.edge.stop_order
                
                // Find route2 that serves both transfer station and end station
                FOR route2 IN routes
                    FILTER route2.status == "active"
                    FILTER route2._key != route1._key
                    
                    LET transfer_serve = FIRST(
                        FOR v, e IN OUTBOUND route2 serves
                            FILTER v.station_id == transfer_station.station_id
                            RETURN e
                    )
                    
                    LET end_serve = FIRST(
                        FOR v, e IN OUTBOUND route2 serves
                            FILTER v.station_id == @end_id
                            RETURN e
                    )
                    
                    FILTER transfer_serve != null AND end_serve != null
                    FILTER transfer_serve.stop_order < end_serve.stop_order
                    
                    LET leg1_duration = e1.arrival_offset - start_serve.edge.arrival_offset
                    LET leg2_duration = end_serve.arrival_offset - transfer_serve.arrival_offset
                    LET total_duration = leg1_duration + leg2_duration + 10 // 10 mins transfer
                    
                    LIMIT 5
                    
                    RETURN {
                        type: "transfer",
                        route1: route1,
                        route2: route2,
                        transfer_station: transfer_station,
                        leg1_duration: leg1_duration,
                        leg2_duration: leg2_duration,
                        total_duration: total_duration
                    }
        """
        
        transfer_result = db.AQLQuery(aql_transfer, bindVars={
            'start_id': start_station['station_id'],
            'end_id': end_station['station_id']
        }, rawResults=True)
        
        transfer_routes = list(transfer_result)
        
        if transfer_routes:
            # Sort by total duration
            best_transfer = min(transfer_routes, key=lambda x: x['total_duration'])
            
            walk_to_start = calculate_distance(
                from_lat, from_lng,
                start_station['location']['latitude'],
                start_station['location']['longitude']
            )
            
            walk_from_end = calculate_distance(
                to_lat, to_lng,
                end_station['location']['latitude'],
                end_station['location']['longitude']
            )
            
            return jsonify({
                "success": True,
                "data": [{
                    "type": "transfer",
                    "route1": best_transfer['route1'],
                    "route2": best_transfer['route2'],
                    "start_station": start_station,
                    "transfer_station": best_transfer['transfer_station'],
                    "end_station": end_station,
                    "leg1_duration": best_transfer['leg1_duration'],
                    "leg2_duration": best_transfer['leg2_duration'],
                    "walk_to_start": round(walk_to_start),
                    "walk_from_end": round(walk_from_end),
                    "total_duration": best_transfer['total_duration'] + 10,
                    "instructions": [
                        f"Đi bộ {round(walk_to_start)}m đến {start_station['name']}",
                        f"Bắt xe buýt tuyến {best_transfer['route1']['route_code']} ({best_transfer['leg1_duration']} phút)",
                        f"Xuống tại {best_transfer['transfer_station']['name']} để chuyển tuyến",
                        f"Bắt xe buýt tuyến {best_transfer['route2']['route_code']} ({best_transfer['leg2_duration']} phút)",
                        f"Xuống tại {end_station['name']}",
                        f"Đi bộ {round(walk_from_end)}m đến đích"
                    ]
                }]
            }), 200
        
        # No route found
        return jsonify({
            "success": False,
            "error": f"Không tìm thấy lộ trình từ {start_station['name']} đến {end_station['name']}. Vui lòng thử địa điểm khác hoặc kiểm tra dữ liệu tuyến xe."
        }), 404
        
    except Exception as e:
        print(f"Error in find_shortest_path: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
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