from flask import Blueprint, jsonify, request
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required
from app.utils.redis_connection import cache_response, invalidate_cache

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
@cache_response(ttl=60, key_prefix='analytics_overview')  # Cache 1 minute

def get_overview():
    """Get system overview statistics"""
    try:
        db = db_connection.get_db()
        
        # Count queries
        aql_stations_total = "RETURN LENGTH(stations)"
        aql_stations_active = "FOR s IN stations FILTER s.status == 'active' RETURN 1"
        aql_routes_total = "RETURN LENGTH(routes)"
        aql_routes_active = "FOR r IN routes FILTER r.status == 'active' RETURN 1"
        aql_vehicles_total = "RETURN LENGTH(vehicles)"
        aql_vehicles_active = "FOR v IN vehicles FILTER v.status == 'active' RETURN 1"
        
        total_stations = list(db.AQLQuery(aql_stations_total, rawResults=True))[0]
        active_stations = len(list(db.AQLQuery(aql_stations_active, rawResults=True)))
        total_routes = list(db.AQLQuery(aql_routes_total, rawResults=True))[0]
        active_routes = len(list(db.AQLQuery(aql_routes_active, rawResults=True)))
        total_vehicles = list(db.AQLQuery(aql_vehicles_total, rawResults=True))[0]
        active_vehicles = len(list(db.AQLQuery(aql_vehicles_active, rawResults=True)))
        
        stats = {
            'total_stations': total_stations,
            'active_stations': active_stations,
            'total_routes': total_routes,
            'active_routes': active_routes,
            'total_vehicles': total_vehicles,
            'active_vehicles': active_vehicles,
        }
        
        return jsonify({
            "success": True,
            "data": stats
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/stations-by-ward', methods=['GET'])
@jwt_required()

def get_stations_by_ward():
    
    """Get stations distribution by ward (không còn district)"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR station IN stations
        COLLECT ward = station.address.ward, city = station.address.city 
        WITH COUNT INTO total
        SORT total DESC
        LIMIT 30
        RETURN {
            ward: ward,
            city: city,
            count: total
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

@analytics_bp.route('/stations-by-type', methods=['GET'])
@jwt_required()
def get_stations_by_type():
    """Get stations distribution by type"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR station IN stations
        COLLECT type = station.type WITH COUNT INTO total
        RETURN {
            type: type,
            count: total
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
@cache_response(ttl=300, key_prefix='analytics_busiest')  # Cache 5 minutes

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

@analytics_bp.route('/vehicles-utilization', methods=['GET'])
@jwt_required()
@cache_response(ttl=120, key_prefix='analytics_vehicles')  # Cache 2 minutes

def get_vehicles_utilization():
    """Get vehicle utilization statistics"""
    try:
        db = db_connection.get_db()
        
        # Total vehicles
        aql_total = "RETURN LENGTH(vehicles)"
        total = list(db.AQLQuery(aql_total, rawResults=True))[0]
        
        # Assigned vehicles
        aql_assigned = """
        FOR v IN vehicles
        LET has_route = LENGTH(FOR r IN OUTBOUND v operates_on RETURN 1) > 0
        FILTER has_route
        RETURN 1
        """
        assigned = len(list(db.AQLQuery(aql_assigned, rawResults=True)))
        
        unassigned = total - assigned
        utilization_rate = (assigned / total * 100) if total > 0 else 0
        
        # By status
        aql_by_status = """
        FOR v IN vehicles
        COLLECT status = v.status WITH COUNT INTO count
        RETURN {
            status: status,
            count: count
        }
        """
        by_status = list(db.AQLQuery(aql_by_status, rawResults=True))
        
        # By type
        aql_by_type = """
        FOR v IN vehicles
        COLLECT type = v.type WITH COUNT INTO count
        RETURN {
            type: type,
            count: count
        }
        """
        by_type = list(db.AQLQuery(aql_by_type, rawResults=True))
        
        data = {
            'total': total,
            'assigned': assigned,
            'unassigned': unassigned,
            'utilization_rate': utilization_rate,
            'by_status': by_status,
            'by_type': by_type
        }
        
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
    """Get route coverage statistics"""
    try:
        db = db_connection.get_db()
        
        aql = """
        FOR route IN routes
        LET stations = (
            FOR v, e IN OUTBOUND route serves
                RETURN v
        )
        LET wards = UNIQUE(stations[*].address.ward)
        RETURN {
            route: route,
            total_stops: LENGTH(stations),
            wards_covered: LENGTH(wards),
            wards: wards
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