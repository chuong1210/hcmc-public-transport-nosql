from flask import Blueprint, request, jsonify
from datetime import datetime
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required, get_jwt

schedule_bp = Blueprint('schedules', __name__, url_prefix='/api/schedules')

@schedule_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_schedules():
    """Get all schedules"""
    try:
        db = db_connection.get_db()
        
        route_id = request.args.get('route_id')
        vehicle_id = request.args.get('vehicle_id')
        day_of_week = request.args.get('day_of_week')
        
        aql = """
        FOR schedule IN schedules
        """
        filters = []
        bind_vars = {}
        
        if route_id:
            filters.append("schedule.route_id == @route_id")
            bind_vars['route_id'] = route_id
        if vehicle_id:
            filters.append("schedule.vehicle_id == @vehicle_id")
            bind_vars['vehicle_id'] = vehicle_id
        if day_of_week:
            filters.append("@day_of_week IN schedule.day_of_week")
            bind_vars['day_of_week'] = day_of_week
        
        if filters:
            aql += " FILTER " + " AND ".join(filters)
        
        aql += """
            LET route = FIRST(FOR r IN routes FILTER r.route_id == schedule.route_id RETURN r)
            LET vehicle = FIRST(FOR v IN vehicles FILTER v.vehicle_id == schedule.vehicle_id RETURN v)
            SORT schedule.departure_time
            RETURN MERGE(schedule, {
                route_info: route,
                vehicle_info: vehicle
            })
        """
        
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        schedules = list(result)
        
        return jsonify({
            "success": True,
            "count": len(schedules),
            "data": schedules
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@schedule_bp.route('/', methods=['POST'])
@jwt_required()
def create_schedule():
    """Create new schedule"""
    try:
        data = request.get_json()
        
        required_fields = ['route_id', 'vehicle_id', 'departure_time', 'day_of_week']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        data['created_at'] = datetime.now().isoformat()
        data['status'] = data.get('status', 'scheduled')
        
        collection = db_connection.get_collection('schedules')
        doc = collection.createDocument(data)
        doc.save()
        
        return jsonify({
            "success": True,
            "message": "Schedule created successfully",
            "data": data
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@schedule_bp.route('/<schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_schedule(schedule_id):
    """Delete schedule"""
    try:
        db = db_connection.get_db()
        
        aql_delete = """
        FOR schedule IN schedules
            FILTER schedule._key == @schedule_id
            REMOVE schedule IN schedules
        """
        
        db.AQLQuery(aql_delete, bindVars={'schedule_id': schedule_id})
        
        return jsonify({
            "success": True,
            "message": "Schedule deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500