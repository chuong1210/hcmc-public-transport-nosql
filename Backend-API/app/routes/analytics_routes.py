from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """Get system overview statistics"""
    try:
        db = db_connection.get_db()
        
        # Count stations
        stations_count = len(list(db.AQLQuery("FOR s IN stations RETURN s", rawResults=True)))
        
        # Count routes
        routes_count = len(list(db.AQLQuery("FOR r IN routes RETURN r", rawResults=True)))
        
        # Count active routes
        active_routes = len(list(db.AQLQuery(
            "FOR r IN routes FILTER r.status == 'active' RETURN r",
            rawResults=True
        )))
        
        # Count vehicles
        vehicles_count = len(list(db.AQLQuery("FOR v IN vehicles RETURN v", rawResults=True)))
        
        # Count users
        try:
            users_count = len(list(db.AQLQuery("FOR u IN users RETURN u", rawResults=True)))
        except:
            users_count = 0
        
        return jsonify({
            "success": True,
            "data": {
                "total_stations": stations_count,
                "total_routes": routes_count,
                "active_routes": active_routes,
                "total_vehicles": vehicles_count,
                "total_users": users_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/stations-by-type', methods=['GET'])
@jwt_required()
def get_stations_by_type():
    """Get station statistics by type"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR station IN stations
            COLLECT type = station.type WITH COUNT INTO count
            RETURN {
                type: type,
                count: count
            }
        """
        
        result = db.AQLQuery(aql, rawResults=True)
        data = list(result)
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/stations-by-district', methods=['GET'])
@jwt_required()
def get_stations_by_district():
    """Get station statistics by district"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR station IN stations
            COLLECT district = station.address.district WITH COUNT INTO count
            SORT count DESC
            RETURN {
                district: district,
                count: count
            }
        """
        
        result = db.AQLQuery(aql, rawResults=True)
        data = list(result)
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/routes-by-type', methods=['GET'])
@jwt_required()
def get_routes_by_type():
    """Get route statistics by type"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR route IN routes
            COLLECT type = route.type WITH COUNT INTO count
            RETURN {
                type: type,
                count: count
            }
        """
        
        result = db.AQLQuery(aql, rawResults=True)
        data = list(result)
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/busiest-stations', methods=['GET'])
@jwt_required()
def get_busiest_stations():
    """Get busiest stations (most routes passing through)"""
    try:
        db = db_connection.get_db()
        limit = int(request.args.get('limit', 10))
        
        aql = """
        FOR station IN stations
            LET route_count = LENGTH(
                FOR route IN routes
                    FOR v, e IN OUTBOUND route serves
                        FILTER v._key == station._key
                        RETURN 1
            )
            SORT route_count DESC
            LIMIT @limit
            RETURN {
                station: station,
                route_count: route_count
            }
        """
        
        result = db.AQLQuery(aql, bindVars={'limit': limit}, rawResults=True)
        data = list(result)
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/route-coverage', methods=['GET'])
@jwt_required()
def get_route_coverage():
    """Get route coverage by district"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR route IN routes
            LET stations = (
                FOR v, e IN OUTBOUND route serves
                    RETURN v
            )
            LET districts = UNIQUE(stations[*].address.district)
            RETURN {
                route: route,
                districts_covered: LENGTH(districts),
                districts: districts,
                total_stops: LENGTH(stations)
            }
        """
        
        result = db.AQLQuery(aql, rawResults=True)
        data = list(result)
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/vehicles-utilization', methods=['GET'])
@jwt_required()
def get_vehicles_utilization():
    """Get vehicle utilization statistics"""
    try:
        db = db_connection.get_db()
        
        aql = """
        LET total_vehicles = LENGTH(FOR v IN vehicles RETURN 1)
        LET assigned_vehicles = LENGTH(
            FOR v IN vehicles
                LET has_route = LENGTH(
                    FOR r, e IN OUTBOUND v operates_on
                        RETURN 1
                ) > 0
                FILTER has_route
                RETURN 1
        )
        LET by_status = (
            FOR vehicle IN vehicles
                COLLECT status = vehicle.status WITH COUNT INTO count
                RETURN {status: status, count: count}
        )
        LET by_type = (
            FOR vehicle IN vehicles
                COLLECT type = vehicle.type WITH COUNT INTO count
                RETURN {type: type, count: count}
        )
        
        RETURN {
            total: total_vehicles,
            assigned: assigned_vehicles,
            unassigned: total_vehicles - assigned_vehicles,
            utilization_rate: assigned_vehicles * 100 / total_vehicles,
            by_status: by_status,
            by_type: by_type
        }
        """
        
        result = db.AQLQuery(aql, rawResults=True)
        data = list(result)[0] if list(result) else {}
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500