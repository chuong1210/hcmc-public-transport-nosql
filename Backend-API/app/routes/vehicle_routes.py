from flask import Blueprint, request, jsonify
from datetime import datetime
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required, get_jwt

vehicle_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

def require_permission(permission):
    """Decorator to check user permissions"""
    def decorator(fn):
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            permissions = claims.get('permissions', [])
            
            if permission not in permissions:
                return jsonify({
                    "success": False,
                    "error": "Insufficient permissions"
                }), 403
            
            return fn(*args, **kwargs)
        wrapper.__name__ = fn.__name__
        return wrapper
    return decorator


@vehicle_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_vehicles():
    """Get all vehicles with pagination"""
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
        aql = "FOR vehicle IN vehicles"
        filters = []
        bind_vars = {'offset': offset, 'limit': limit}
        
        if status:
            filters.append("vehicle.status == @status")
            bind_vars['status'] = status
        if type_:
            filters.append("vehicle.type == @type")
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
        aql += " SORT vehicle.license_plate LIMIT @offset, @limit RETURN vehicle"
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        vehicles = list(result)
        
        return jsonify({
            "success": True,
            "data": vehicles,
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


@vehicle_bp.route('/<vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle(vehicle_id):
    """Get vehicle by ID"""
    try:
        db = db_connection.get_db()
        
        aql = """
        LET vehicle = FIRST(
            FOR v IN vehicles
                FILTER v.vehicle_id == @vehicle_id
                RETURN v
        )
        
        LET current_route = FIRST(
            FOR v, e IN OUTBOUND CONCAT('vehicles/', vehicle._key) operates_on
                RETURN {
                    route: v,
                    assignment: e
                }
        )
        
        RETURN {
            vehicle: vehicle,
            current_route: current_route
        }
        """
        
        bind_vars = {'vehicle_id': vehicle_id}
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        data = list(result)
        
        if not data or not data[0]['vehicle']:
            return jsonify({
                "success": False,
                "error": "Vehicle not found"
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

@vehicle_bp.route('/', methods=['POST'])
@require_permission('write')
def create_vehicle():
    """Create new vehicle"""
    try:
        data = request.get_json()
        
        required_fields = ['vehicle_id', 'license_plate', 'type', 'capacity']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Add timestamps
        data['_key'] = data['vehicle_id']
        data['created_at'] = datetime.now().isoformat()
        data['updated_at'] = datetime.now().isoformat()
        
        collection = db_connection.get_collection('vehicles')
        doc = collection.createDocument(data)
        doc.save()
        
        return jsonify({
            "success": True,
            "message": "Vehicle created successfully",
            "data": data
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@vehicle_bp.route('/<vehicle_id>', methods=['PUT'])
@require_permission('write')
def update_vehicle(vehicle_id):
    """Update vehicle"""
    try:
        data = request.get_json()
        db = db_connection.get_db()
        
        aql_check = """
        FOR vehicle IN vehicles
            FILTER vehicle.vehicle_id == @vehicle_id
            RETURN vehicle
        """
        result = db.AQLQuery(aql_check, bindVars={'vehicle_id': vehicle_id}, rawResults=True)
        vehicles = list(result)
        
        if not vehicles:
            return jsonify({
                "success": False,
                "error": "Vehicle not found"
            }), 404
        
        data['updated_at'] = datetime.now().isoformat()
        
        aql_update = """
        FOR vehicle IN vehicles
            FILTER vehicle.vehicle_id == @vehicle_id
            UPDATE vehicle WITH @data IN vehicles
            RETURN NEW
        """
        
        result = db.AQLQuery(aql_update, bindVars={'vehicle_id': vehicle_id, 'data': data}, rawResults=True)
        updated_vehicle = list(result)[0]
        
        return jsonify({
            "success": True,
            "message": "Vehicle updated successfully",
            "data": updated_vehicle
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@vehicle_bp.route('/<vehicle_id>', methods=['DELETE'])
@require_permission('delete')
def delete_vehicle(vehicle_id):
    """Delete vehicle"""
    try:
        db = db_connection.get_db()
        
        aql_check = """
        FOR vehicle IN vehicles
            FILTER vehicle.vehicle_id == @vehicle_id
            RETURN vehicle
        """
        result = db.AQLQuery(aql_check, bindVars={'vehicle_id': vehicle_id}, rawResults=True)
        vehicles = list(result)
        
        if not vehicles:
            return jsonify({
                "success": False,
                "error": "Vehicle not found"
            }), 404
        
        aql_delete = """
        FOR vehicle IN vehicles
            FILTER vehicle.vehicle_id == @vehicle_id
            REMOVE vehicle IN vehicles
        """
        
        db.AQLQuery(aql_delete, bindVars={'vehicle_id': vehicle_id})
        
        return jsonify({
            "success": True,
            "message": "Vehicle deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@vehicle_bp.route('/<vehicle_id>/assign', methods=['POST'])
@require_permission('write')
def assign_vehicle_to_route(vehicle_id):
    """Assign vehicle to route"""
    try:
        data = request.get_json()
        route_id = data.get('route_id')
        
        if not route_id:
            return jsonify({
                "success": False,
                "error": "route_id is required"
            }), 400
        
        db = db_connection.get_db()
        
        # Check if vehicle exists
        aql_check = """
        FOR vehicle IN vehicles
            FILTER vehicle.vehicle_id == @vehicle_id
            RETURN vehicle
        """
        result = db.AQLQuery(aql_check, bindVars={'vehicle_id': vehicle_id}, rawResults=True)
        if not list(result):
            return jsonify({
                "success": False,
                "error": "Vehicle not found"
            }), 404
        
        # Check if route exists
        aql_check = """
        FOR route IN routes
            FILTER route.route_id == @route_id
            RETURN route
        """
        result = db.AQLQuery(aql_check, bindVars={'route_id': route_id}, rawResults=True)
        if not list(result):
            return jsonify({
                "success": False,
                "error": "Route not found"
            }), 404
        
        # Create edge
        edge_data = {
            "_from": f"vehicles/{vehicle_id}",
            "_to": f"routes/{route_id}",
            "assignment_date": datetime.now().isoformat(),
            "shift": data.get('shift', 'morning'),
            "start_time": data.get('start_time', '05:00'),
            "end_time": data.get('end_time', '12:00'),
            "status": "active"
        }
        
        collection = db_connection.get_collection('operates_on')
        doc = collection.createDocument(edge_data)
        doc.save()
        
        return jsonify({
            "success": True,
            "message": "Vehicle assigned to route successfully",
            "data": edge_data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500