from flask import Blueprint, request, jsonify
from app.utils.db_connection import db_connection
from flask_jwt_extended import jwt_required, get_jwt

query_bp = Blueprint('query', __name__, url_prefix='/api/query')

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

@query_bp.route('/execute', methods=['POST'])
@jwt_required()
def execute_query():
    """Execute AQL query"""
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({
                "success": False,
                "error": "Query is required"
            }), 400
        
        # Security: Check for dangerous operations
        dangerous_keywords = ['DROP', 'DELETE', 'REMOVE', 'UPDATE', 'REPLACE', 'INSERT']
        query_upper = query.upper()
        
        for keyword in dangerous_keywords:
            if keyword in query_upper:
                return jsonify({
                    "success": False,
                    "error": f"Operation '{keyword}' is not allowed in query execution"
                }), 403
        
        db = db_connection.get_db()
        
        # Execute query
        result = db.AQLQuery(query, rawResults=True)
        data = list(result)
        
        return jsonify({
            "success": True,
            "count": len(data),
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500