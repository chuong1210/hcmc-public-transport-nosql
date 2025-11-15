from flask import Blueprint, request, jsonify
from app.utils.db_connection import db_connection
from app.models.station import Station
from datetime import datetime
from flask_jwt_extended import jwt_required
station_bp = Blueprint('stations', __name__, url_prefix='/api/stations')

@station_bp.route('/', methods=['GET'])
def get_all_stations():
    """Get all stations"""
    print( "Hello from get_all_routes" )

    try:
        db = db_connection.get_db()
        
        # Query parameters
        status = request.args.get('status')
        type_ = request.args.get('type')
        
        # Build AQL query
        aql = "FOR station IN stations"
        filters = []
        
        if status:
            filters.append(f"station.status == '{status}'")
        if type_:
            filters.append(f"station.type == '{type_}'")
        
        if filters:
            aql += " FILTER " + " AND ".join(filters)
        
        aql += " SORT station.name RETURN station"
        
        # Execute query
        result = db.AQLQuery(aql, rawResults=True)
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

@station_bp.route('/<station_id>', methods=['GET'])
def get_station(station_id):
    """Get station by ID"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR station IN stations
            FILTER station.station_id == @station_id
            RETURN station
        """
        
        bind_vars = {'station_id': station_id}
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        stations = list(result)
        
        if not stations:
            return jsonify({
                "success": False,
                "error": "Station not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": stations[0]
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@station_bp.route('/', methods=['POST'])
def create_station():
    """Create new station"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['station_id', 'name', 'address', 'location']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Create Station object
        station = Station.from_dict(data)
        
        # Insert to database
        collection = db_connection.get_collection('stations')
        doc = collection.createDocument(station.to_dict())
        doc.save()
        
        return jsonify({
            "success": True,
            "message": "Station created successfully",
            "data": station.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@station_bp.route('/<station_id>', methods=['PUT'])
def update_station(station_id):
    """Update station"""
    try:
        data = request.get_json()
        db = db_connection.get_db()
        
        # Check if station exists
        aql_check = """
        FOR station IN stations
            FILTER station.station_id == @station_id
            RETURN station
        """
        bind_vars = {'station_id': station_id}
        result = db.AQLQuery(aql_check, bindVars=bind_vars, rawResults=True)
        stations = list(result)
        
        if not stations:
            return jsonify({
                "success": False,
                "error": "Station not found"
            }), 404
        
        # Update station
        data['updated_at'] = datetime.now().isoformat()
        
        aql_update = """
        FOR station IN stations
            FILTER station.station_id == @station_id
            UPDATE station WITH @data IN stations
            RETURN NEW
        """
        
        bind_vars = {
            'station_id': station_id,
            'data': data
        }
        
        result = db.AQLQuery(aql_update, bindVars=bind_vars, rawResults=True)
        updated_station = list(result)[0]
        
        return jsonify({
            "success": True,
            "message": "Station updated successfully",
            "data": updated_station
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@station_bp.route('/<station_id>', methods=['DELETE'])
def delete_station(station_id):
    """Delete station"""
    try:
        db = db_connection.get_db()
        
        # Check if station exists
        aql_check = """
        FOR station IN stations
            FILTER station.station_id == @station_id
            RETURN station
        """
        bind_vars = {'station_id': station_id}
        result = db.AQLQuery(aql_check, bindVars=bind_vars, rawResults=True)
        stations = list(result)
        
        if not stations:
            return jsonify({
                "success": False,
                "error": "Station not found"
            }), 404
        
        # Delete station
        aql_delete = """
        FOR station IN stations
            FILTER station.station_id == @station_id
            REMOVE station IN stations
        """
        
        db.AQLQuery(aql_delete, bindVars=bind_vars)
        
        return jsonify({
            "success": True,
            "message": "Station deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500