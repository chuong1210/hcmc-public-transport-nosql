from flask import Blueprint, jsonify
from app.utils.redis_connection import redis_connection, invalidate_cache
from flask_jwt_extended import jwt_required

redis_bp = Blueprint('redis', __name__, url_prefix='/api/redis')

@redis_bp.route('/status', methods=['GET'])
@jwt_required()
def get_redis_status():
    """Get Redis status"""
    try:
        redis_client = redis_connection.get_client()
        
        if not redis_client:
            return jsonify({
                "success": False,
                "connected": False,
                "message": "Redis client not initialized"
            }), 503
        
        # Get Redis info
        info = redis_client.info()
        
        # Get key count
        db_size = redis_client.dbsize()
        
        # Sample some keys
        sample_keys = redis_client.keys('*')[:20]
        
        return jsonify({
            "success": True,
            "connected": True,
            "data": {
                "version": info.get('redis_version'),
                "uptime_days": info.get('uptime_in_days'),
                "connected_clients": info.get('connected_clients'),
                "used_memory_human": info.get('used_memory_human'),
                "total_keys": db_size,
                "sample_keys": sample_keys
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "connected": False,
            "error": str(e)
        }), 500

@redis_bp.route('/clear', methods=['POST'])
@jwt_required()
def clear_cache():
    """Clear all cache"""
    try:
        invalidate_cache('*')
        
        return jsonify({
            "success": True,
            "message": "All cache cleared"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@redis_bp.route('/clear/<pattern>', methods=['POST'])
@jwt_required()
def clear_cache_pattern(pattern):
    """Clear cache by pattern"""
    try:
        invalidate_cache(f'{pattern}:*')
        
        return jsonify({
            "success": True,
            "message": f"Cache cleared for pattern: {pattern}"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500