from flask import Blueprint, request, jsonify
from datetime import datetime
from app.utils.db_connection import db_connection
from app.models.route import Route

route_bp = Blueprint('routes', __name__, url_prefix='/api/routes')

@route_bp.route('/', methods=['GET'])
def get_all_routes():
    """Get all routes"""
    try:
        db = db_connection.get_db()
        
        status = request.args.get('status')
        type_ = request.args.get('type')
        
        aql = "FOR route IN routes"
        filters = []
        
        if status:
            filters.append(f"route.status == '{status}'")
        if type_:
            filters.append(f"route.type == '{type_}'")
        
        if filters:
            aql += " FILTER " + " AND ".join(filters)
        
        aql += " SORT route.route_code RETURN route"
        
        result = db.AQLQuery(aql, rawResults=True)
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
        
        required_fields = ['route_id', 'route_name', 'route_code']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
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
def update_route(route_id):
    """Update route"""
    try:
        data = request.get_json()
        db = db_connection.get_db()
        
        # Similar to update_station implementation
        # ... (tương tự như station)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@route_bp.route('/<route_id>', methods=['DELETE'])
def delete_route(route_id):
    """Delete route"""
    try:
        db = db_connection.get_db()
        
        # Similar to delete_station implementation
        # ... (tương tự như station)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500