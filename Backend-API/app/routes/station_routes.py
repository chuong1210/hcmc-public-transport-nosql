
from flask import Blueprint, request, jsonify
from app.utils.db_connection import db_connection
from app.models.station import create_station_document, validate_station_data
from flask_jwt_extended import jwt_required, get_jwt
from app.utils.redis_connection import cache_response, invalidate_cache

station_bp = Blueprint('station', __name__, url_prefix='/api/stations')

@station_bp.route('/', methods=['GET'])
@jwt_required()
@cache_response(ttl=180, key_prefix='stations_list')  # Cache 3 minutes

def get_all_stations():
    """Get all stations with pagination"""
    try:
        db = db_connection.get_db()
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        offset = (page - 1) * limit
        
        # Filters
        status = request.args.get('status')
        type_ = request.args.get('type')
        
        # Build AQL query
        aql = "FOR station IN stations"
        filters = []
        bind_vars = {
            'offset': offset,
            'limit': limit
        }
        
        if status:
            filters.append("station.status == @status")
            bind_vars['status'] = status
        if type_:
            filters.append("station.type == @type")
            bind_vars['type'] = type_
        
        if filters:
            aql += " FILTER " + " AND ".join(filters)
        
        # Count total
        count_aql = aql + " COLLECT WITH COUNT INTO total RETURN total"
        count_result = db.AQLQuery(
            count_aql, 
            bindVars={k: v for k, v in bind_vars.items() if k not in ['offset', 'limit']}, 
            rawResults=True
        )
        total = list(count_result)[0] if list(count_result) else 0
        
        # Get paginated data
        aql += " SORT station.name LIMIT @offset, @limit RETURN station"
        result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
        stations = list(result)
        
        return jsonify({
            "success": True,
            "data": stations,
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
# backend/app/routes/station_routes.py

@station_bp.route('/<station_id>', methods=['GET'])
@jwt_required()
@cache_response(ttl=300, key_prefix='station_detail')  # Cache 5 minutes

def get_station(station_id):
    """Get station by ID with routes passing through"""
    try:
        db = db_connection.get_db()
        
        # Get station
        aql_station = """
        FOR station IN stations
        FILTER station.station_id == @station_id
        RETURN station
        """
        
        station_result = db.AQLQuery(aql_station, bindVars={'station_id': station_id}, rawResults=True)
        stations_list = list(station_result)
        
        if not stations_list:
            return jsonify({
                "success": False,
                "error": "Station not found"
            }), 404
        
        station = stations_list[0]
        
        # Get routes passing through this station
        aql_routes = """
        FOR route IN routes
            FOR v, e IN OUTBOUND route serves
                FILTER v.station_id == @station_id
                RETURN {
                    route: route,
                    stop_order: e.stop_order,
                    arrival_offset: e.arrival_offset,
                    is_main_stop: e.is_main_stop
                }
        """
        
        routes_result = db.AQLQuery(aql_routes, bindVars={'station_id': station_id}, rawResults=True)
        routes_passing = list(routes_result)
        
        return jsonify({
            "success": True,
            "data": {
                "station": station,
                "routes_passing_through": routes_passing
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
# @station_bp.route('/<station_id>', methods=['GET'])
# @jwt_required()
# def get_station(station_id):
#     """Get station by ID"""
#     try:
#         db = db_connection.get_db()
#         stations_collection = db['stations']
        
#         # Find station
#         station = stations_collection.fetchFirstExample({'station_id': station_id})
        
#         if not station:
#             return jsonify({
#                 "success": False,
#                 "error": "Station not found"
#             }), 404
        
#         return jsonify({
#             "success": True,
#             "data": {
#                 "station": station[0]
#             }
#         }), 200
        
#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         }), 500

@station_bp.route('/', methods=['POST'])
@jwt_required()
def create_station():
    """Create new station"""
    try:
        data = request.get_json()
        
        # Validate data
        is_valid, error = validate_station_data(data)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": error
            }), 400
        
        db = db_connection.get_db()
        stations_collection = db['stations']
        
        # Check if station_id already exists
        existing = stations_collection.fetchFirstExample({'station_id': data['station_id']})
        if existing:
            return jsonify({
                "success": False,
                "error": "Station ID already exists"
            }), 409
        
        # Create document
        station_doc = create_station_document(data)
        
        # Insert
        result = stations_collection.createDocument(station_doc)
        result.save()
        
              # Invalidate related caches
        invalidate_cache('stations_list:*')
        invalidate_cache('analytics_*')
        
        return jsonify({
            "success": True,
            "data": {
                "station": result.getStore()
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@station_bp.route('/<station_id>', methods=['PUT'])
@jwt_required()
def update_station(station_id):
    """Update station"""
    try:
        data = request.get_json()
        
        db = db_connection.get_db()
        stations_collection = db['stations']
        
        # Find station
        station = stations_collection.fetchFirstExample({'station_id': station_id})
        if not station:
            return jsonify({
                "success": False,
                "error": "Station not found"
            }), 404
        
        # Update document
        station_doc = station[0]
        
        # Update fields
        if 'name' in data:
            station_doc['name'] = data['name']
        if 'address' in data:
            station_doc['address'] = {
                'street': data['address'].get('street'),
                'ward': data['address'].get('ward'),
                'city': data['address'].get('city', 'TP.HCM')
            }
        if 'location' in data:
            station_doc['location'] = data['location']
        if 'type' in data:
            station_doc['type'] = data['type']
        if 'status' in data:
            station_doc['status'] = data['status']
        if 'capacity' in data:
            station_doc['capacity'] = data['capacity']
        if 'facilities' in data:
            station_doc['facilities'] = data['facilities']
        
        station_doc.save()
        
        invalidate_cache('stations_list:*')
        invalidate_cache(f'station_detail:*{station_id}*')
        invalidate_cache('analytics_*')
        
        return jsonify({
            "success": True,
            "data": {
                "station": station_doc.getStore()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@station_bp.route('/<station_id>', methods=['DELETE'])
@jwt_required()
def delete_station(station_id):
    """Delete station"""
    try:
        db = db_connection.get_db()
        stations_collection = db['stations']
        
        # Find station
        station = stations_collection.fetchFirstExample({'station_id': station_id})
        if not station:
            return jsonify({
                "success": False,
                "error": "Station not found"
            }), 404
        
        # Delete
        station[0].delete()
        
                # Invalidate related caches
        invalidate_cache('stations_*')
        invalidate_cache('analytics_*')
        invalidate_cache('journey_*')
        return jsonify({
            "success": True,
            "message": "Station deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# from flask import Blueprint, request, jsonify
# from app.utils.db_connection import db_connection
# from app.models.station import Station
# from datetime import datetime
# from flask_jwt_extended import jwt_required
# station_bp = Blueprint('stations', __name__, url_prefix='/api/stations')

# @station_bp.route('/', methods=['GET'])
# def get_all_stations():
#     """Get all stations"""
#     print( "Hello from get_all_routes" )

#     try:
#         db = db_connection.get_db()
        
#         # Query parameters
#         status = request.args.get('status')
#         type_ = request.args.get('type')
        
#         # Build AQL query
#         aql = "FOR station IN stations"
#         filters = []
        
#         if status:
#             filters.append(f"station.status == '{status}'")
#         if type_:
#             filters.append(f"station.type == '{type_}'")
        
#         if filters:
#             aql += " FILTER " + " AND ".join(filters)
        
#         aql += " SORT station.name RETURN station"
        
#         # Execute query
#         result = db.AQLQuery(aql, rawResults=True)
#         stations = list(result)
        
#         return jsonify({
#             "success": True,
#             "count": len(stations),
#             "data": stations
#         }), 200
        
#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         }), 500

# @station_bp.route('/<station_id>', methods=['GET'])
# def get_station(station_id):
#     """Get station by ID"""
#     try:
#         db = db_connection.get_db()
        
#         aql = """
#         FOR station IN stations
#             FILTER station.station_id == @station_id
#             RETURN station
#         """
        
#         bind_vars = {'station_id': station_id}
#         result = db.AQLQuery(aql, bindVars=bind_vars, rawResults=True)
#         stations = list(result)
        
#         if not stations:
#             return jsonify({
#                 "success": False,
#                 "error": "Station not found"
#             }), 404
        
#         return jsonify({
#             "success": True,
#             "data": stations[0]
#         }), 200
        
#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         }), 500

# @station_bp.route('/', methods=['POST'])
# def create_station():
#     """Create new station"""
#     try:
#         data = request.get_json()
        
#         # Validate required fields
#         required_fields = ['station_id', 'name', 'address', 'location']
#         for field in required_fields:
#             if field not in data:
#                 return jsonify({
#                     "success": False,
#                     "error": f"Missing required field: {field}"
#                 }), 400
        
#         # Create Station object
#         station = Station.from_dict(data)
        
#         # Insert to database
#         collection = db_connection.get_collection('stations')
#         doc = collection.createDocument(station.to_dict())
#         doc.save()
        
#         return jsonify({
#             "success": True,
#             "message": "Station created successfully",
#             "data": station.to_dict()
#         }), 201
        
#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         }), 500

# @station_bp.route('/<station_id>', methods=['PUT'])
# def update_station(station_id):
#     """Update station"""
#     try:
#         data = request.get_json()
#         db = db_connection.get_db()
        
#         # Check if station exists
#         aql_check = """
#         FOR station IN stations
#             FILTER station.station_id == @station_id
#             RETURN station
#         """
#         bind_vars = {'station_id': station_id}
#         result = db.AQLQuery(aql_check, bindVars=bind_vars, rawResults=True)
#         stations = list(result)
        
#         if not stations:
#             return jsonify({
#                 "success": False,
#                 "error": "Station not found"
#             }), 404
        
#         # Update station
#         data['updated_at'] = datetime.now().isoformat()
        
#         aql_update = """
#         FOR station IN stations
#             FILTER station.station_id == @station_id
#             UPDATE station WITH @data IN stations
#             RETURN NEW
#         """
        
#         bind_vars = {
#             'station_id': station_id,
#             'data': data
#         }
        
#         result = db.AQLQuery(aql_update, bindVars=bind_vars, rawResults=True)
#         updated_station = list(result)[0]
        
#         return jsonify({
#             "success": True,
#             "message": "Station updated successfully",
#             "data": updated_station
#         }), 200
        
#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         }), 500

# @station_bp.route('/<station_id>', methods=['DELETE'])
# def delete_station(station_id):
#     """Delete station"""
#     try:
#         db = db_connection.get_db()
        
#         # Check if station exists
#         aql_check = """
#         FOR station IN stations
#             FILTER station.station_id == @station_id
#             RETURN station
#         """
#         bind_vars = {'station_id': station_id}
#         result = db.AQLQuery(aql_check, bindVars=bind_vars, rawResults=True)
#         stations = list(result)
        
#         if not stations:
#             return jsonify({
#                 "success": False,
#                 "error": "Station not found"
#             }), 404
        
#         # Delete station
#         aql_delete = """
#         FOR station IN stations
#             FILTER station.station_id == @station_id
#             REMOVE station IN stations
#         """
        
#         db.AQLQuery(aql_delete, bindVars=bind_vars)
        
#         return jsonify({
#             "success": True,
#             "message": "Station deleted successfully"
#         }), 200
        
#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         }), 500