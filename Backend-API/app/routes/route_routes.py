from flask import Blueprint, request, jsonify
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required
from app.models.route import Route
route_bp = Blueprint('route', __name__, url_prefix='/api/routes')
from uuid import uuid4
@route_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_routes():
    """Get all routes with pagination"""
    try:
        db = db_connection.get_db()
        
        # Pagination
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit
        
        # Filters
        status = request.args.get('status')
        type_ = request.args.get('type')
        
        # Build query
        aql = "FOR route IN routes"
        filters = []
        bind_vars = {'offset': offset, 'limit': limit}
        
        if status:
            filters.append("route.status == @status")
            bind_vars['status'] = status
        if type_:
            filters.append("route.type == @type")
            bind_vars['type'] = type_
        
        if filters:
            aql += " FILTER " + " AND ".join(filters)
        
        # Count
        count_aql = aql + " COLLECT WITH COUNT INTO total RETURN total"
        count_result = db.AQLQuery(
            count_aql,
            bindVars={k: v for k, v in bind_vars.items() if k not in ['offset', 'limit']},
            rawResults=True
        )
        total = list(count_result)[0] if list(count_result) else 0
        
        # Get data
        aql += " SORT route.route_code LIMIT @offset, @limit RETURN route"
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        routes = list(result)
        
        return jsonify({
            "success": True,
            "data": routes,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@route_bp.route('/<route_id>', methods=['GET'])
def get_route(route_id):
    """Get route by ID with stations"""
    try:
        db = db_connection.get_db()
        
        # Get route with stations
        aql = """
        LET route = FIRST(
            FOR r IN routes
                FILTER r.route_id == @route_id
                RETURN r
        )
        
        LET stations = (
            FOR v, e IN OUTBOUND CONCAT('routes/', route._key) serves
                SORT e.stop_order
                RETURN {
                    station: v,
                    stop_order: e.stop_order,
                    arrival_offset: e.arrival_offset,
                    is_main_stop: e.is_main_stop
                }
        )
        
        RETURN {
            route: route,
            stations: stations
        }
        """
        
        bind_vars = {'route_id': route_id}
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        data = list(result)
        
        if not data or not data[0]['route']:
            return jsonify({
                "success": False,
                "error": "Route not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": data[0]
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@route_bp.route('/', methods=['POST'])
def create_route():
    """Create new route"""
    try:
        data = request.get_json()
        
        required_fields = [ 'route_name', 'route_code']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        if 'route_id' not in data or not data['route_id']:
            data['route_id'] = f"R{str(uuid4())[:8].upper()}" # VD: R1A2B3C4D
        route = Route.from_dict(data)
        
        collection = db_connection.get_collection('routes')
        doc = collection.createDocument(route.to_dict())
        doc.save()
        
        return jsonify({
            "success": True,
            "message": "Route created successfully",
            "data": route.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
@route_bp.route('/<route_id>', methods=['PUT'])
@jwt_required()  # Thêm jwt_required để bảo mật
def update_route(route_id):
    """Update route"""
    try:
        data = request.get_json()
        db = db_connection.get_db()
        
        # 1. Check if route exists
        aql_check = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            RETURN route
        """
        bind_vars = {'route_id': route_id}
        result = db.AQLQuery(aql_check, bindVars=bind_vars, rawResults=True)
        routes = list(result)
        
        if not routes:
            return jsonify({
                "success": False,
                "error": "Route not found"
            }), 404
        
        # 2. Update route
        # Add updated_at timestamp
        from datetime import datetime
        data['updated_at'] = datetime.now().isoformat()
        
        # Don't allow updating _key or route_id directly via this endpoint if not intended
        # but let's assume data contains safe fields.
        # Remove keys that shouldn't be updated if necessary, e.g. _key, _id, _rev
        for key in ['_key', '_id', '_rev', 'route_id']:
            data.pop(key, None)

        aql_update = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            UPDATE route WITH @data IN routes
            RETURN NEW
        """
        
        bind_vars = {
            'route_id': route_id,
            'data': data
        }
        
        result = db.AQLQuery(aql_update, bindVars=bind_vars, rawResults=True)
        updated_route = list(result)[0]
        
        return jsonify({
            "success": True,
            "message": "Route updated successfully",
            "data": updated_route
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@route_bp.route('/<route_id>', methods=['DELETE'])
@jwt_required() # Thêm jwt_required để bảo mật
def delete_route(route_id):
    """Delete route"""
    try:
        db = db_connection.get_db()
        
        # 1. Check if route exists first
        aql_check = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            RETURN route
        """
        bind_vars = {'route_id': route_id}
        result = db.AQLQuery(aql_check, bindVars=bind_vars, rawResults=True)
        routes = list(result)
        
        if not routes:
            return jsonify({
                "success": False,
                "error": "Route not found"
            }), 404
        
        # 2. Delete route
        # Optional: You might want to delete related edges (serves, operates_on) first 
        # to maintain data integrity, or rely on ArangoDB graph consistency if configured.
        # Here is a simple delete of the document.
        
        # Delete edges first (Recommended for clean cleanup)
        # Delete 'serves' edges connected to this route
        aql_delete_serves = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            FOR v, e IN OUTBOUND route serves
                REMOVE e IN serves
        """
        db.AQLQuery(aql_delete_serves, bindVars=bind_vars)

        # Delete 'operates_on' edges connected to this route (vehicles on this route)
        # operates_on is: Vehicle -> Route (INBOUND from Route perspective)
        aql_delete_operates = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            FOR v, e IN INBOUND route operates_on
                REMOVE e IN operates_on
        """
        db.AQLQuery(aql_delete_operates, bindVars=bind_vars)

        # Finally delete the route document
        aql_delete = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            REMOVE route IN routes
        """
        
        db.AQLQuery(aql_delete, bindVars=bind_vars)
        
        return jsonify({
            "success": True,
            "message": "Route and related connections deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
# backend/app/routes/route_routes.py

@route_bp.route('/<route_id>/stops', methods=['POST'])
@jwt_required()
def add_stop_to_route(route_id):
    """Add a stop to route (create serves edge)"""
    try:
        data = request.get_json()
        station_id = data.get('station_id')
        stop_order = data.get('stop_order', 1)
        arrival_offset = data.get('arrival_offset', 0)
        is_main_stop = data.get('is_main_stop', False)
        
        if not station_id:
            return jsonify({
                "success": False,
                "error": "station_id is required"
            }), 400
        
        db = db_connection.get_db()
        
        # Get route and station documents
        route = db['routes'].fetchFirstExample({'route_id': route_id})
        station = db['stations'].fetchFirstExample({'station_id': station_id})
        
        if not route or not station:
            return jsonify({
                "success": False,
                "error": "Route or station not found"
            }), 404
        
        # Create serves edge
        serves_collection = db['serves']
        edge_data = {
            '_from': f"routes/{route[0]['_key']}",
            '_to': f"stations/{station[0]['_key']}",
            'stop_order': stop_order,
            'arrival_offset': arrival_offset,
            'is_main_stop': is_main_stop
        }
        
        edge = serves_collection.createDocument(edge_data)
        edge.save()
        
        return jsonify({
            "success": True,
            "message": "Stop added to route"
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@route_bp.route('/<route_id>/stops/<station_id>', methods=['DELETE'])
@jwt_required()
def remove_stop_from_route(route_id, station_id):
    """Remove a stop from route (delete serves edge)"""
    try:
        db = db_connection.get_db()
        
        # Find and delete the edge
        aql = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            FOR station IN stations
                FILTER station.station_id == @station_id
                FOR e IN serves
                    FILTER e._from == route._id AND e._to == station._id
                    REMOVE e IN serves
                    RETURN OLD
        """
        
        result = db.AQLQuery(
            aql,
            bindVars={'route_id': route_id, 'station_id': station_id},
            rawResults=True
        )
        
        deleted = list(result)
        
        if not deleted:
            return jsonify({
                "success": False,
                "error": "Stop not found in route"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "Stop removed from route"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@route_bp.route('/<route_id>/stops', methods=['PUT'])
@jwt_required()
def update_route_stops(route_id):
    """Update all stops order for a route"""
    try:
        data = request.get_json()
        stops = data.get('stops', [])
        
        db = db_connection.get_db()
        
        # Update each edge
        for stop in stops:
            aql = """
            FOR route IN routes
                FILTER route.route_id == @route_id
                FOR station IN stations
                    FILTER station.station_id == @station_id
                    FOR e IN serves
                        FILTER e._from == route._id AND e._to == station._id
                        UPDATE e WITH {
                            stop_order: @stop_order,
                            arrival_offset: @arrival_offset,
                            is_main_stop: @is_main_stop
                        } IN serves
                        RETURN NEW
            """
            
            db.AQLQuery(aql, bindVars={
                'route_id': route_id,
                'station_id': stop['station_id'],
                'stop_order': stop['stop_order'],
                'arrival_offset': stop.get('arrival_offset', 0),
                'is_main_stop': stop.get('is_main_stop', False)
            }, rawResults=True)
        
        return jsonify({
            "success": True,
            "message": "Route stops updated"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500