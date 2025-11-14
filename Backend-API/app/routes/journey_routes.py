from flask import Blueprint, request, jsonify
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required

journey_bp = Blueprint('journey', __name__, url_prefix='/api/journey')

@journey_bp.route('/shortest-path', methods=['POST'])
@jwt_required()
def find_shortest_path():
    """Find shortest path between two stations"""
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
        
        # Find shortest path using graph traversal
        aql = """
        LET paths = (
            FOR v, e, p IN 1..10 OUTBOUND @start_vertex GRAPH 'bus_network'
                OPTIONS {uniqueVertices: 'path', bfs: true}
                FILTER v._key == @end_key
                LIMIT 5
                LET total_distance = SUM(p.edges[*].distance)
                LET total_duration = SUM(p.edges[*].duration)
                SORT total_distance
                RETURN {
                    vertices: p.vertices,
                    edges: p.edges,
                    total_distance: total_distance,
                    total_duration: total_duration,
                    stops: LENGTH(p.vertices) - 1
                }
        )
        
        RETURN paths
        """
        
        bind_vars = {
            'start_vertex': f'stations/{from_station}',
            'end_key': to_station
        }
        
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        paths = list(result)[0] if list(result) else []
        
        if not paths:
            return jsonify({
                "success": False,
                "error": "No path found between these stations"
            }), 404
        
        # Enrich with route information
        enriched_paths = []
        for path in paths:
            # Get routes for each connection
            route_info = []
            for i, edge in enumerate(path['edges']):
                from_id = path['vertices'][i]['station_id']
                to_id = path['vertices'][i + 1]['station_id']
                
                # Find routes serving this connection
                route_query = """
                FOR route IN routes
                    LET from_serves = FIRST(
                        FOR v, e IN OUTBOUND route serves
                            FILTER v.station_id == @from_id
                            RETURN e
                    )
                    LET to_serves = FIRST(
                        FOR v, e IN OUTBOUND route serves
                            FILTER v.station_id == @to_id
                            RETURN e
                    )
                    FILTER from_serves != null AND to_serves != null
                    FILTER from_serves.stop_order < to_serves.stop_order
                    RETURN {
                        route: route,
                        from_stop_order: from_serves.stop_order,
                        to_stop_order: to_serves.stop_order
                    }
                """
                
                routes = list(db.AQLQuery(route_query, bindVars={
                    'from_id': from_id,
                    'to_id': to_id
                }, rawResults=True))
                
                route_info.append(routes[0] if routes else None)
            
            enriched_paths.append({
                **path,
                'routes': route_info
            })
        
        return jsonify({
            "success": True,
            "count": len(enriched_paths),
            "data": enriched_paths
        }), 200
        
    except Exception as e:
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