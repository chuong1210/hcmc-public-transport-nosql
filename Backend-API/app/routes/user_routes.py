from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.utils.db_connection import db_connection
from app.models.user import User
from datetime import datetime
user_bp = Blueprint('users', __name__, url_prefix='/api/users')

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

@user_bp.route('/', methods=['GET'])
@require_permission('manage_users')
def get_all_users():
    """Get all users (Admin only)"""
    try:
        db = db_connection.get_db()
        
        # Query parameters
        role = request.args.get('role')
        status = request.args.get('status')
        
        aql = "FOR user IN users"
        filters = []
        
        if role:
            filters.append(f"user.role == '{role}'")
        if status:
            filters.append(f"user.status == '{status}'")
        
        if filters:
            aql += " FILTER " + " AND ".join(filters)
        
        aql += " SORT user.created_at DESC RETURN user"
        
        result = db.AQLQuery(aql, rawResults=True)
        users = list(result)
        
        # Remove password_hash from response
        for user in users:
            user.pop('password_hash', None)
        
        return jsonify({
            "success": True,
            "count": len(users),
            "data": users
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@user_bp.route('/<username>', methods=['GET'])
@require_permission('manage_users')
def get_user(username):
    """Get user by username (Admin only)"""
    try:
        db = db_connection.get_db()
        
        aql = "FOR user IN users FILTER user.username == @username RETURN user"
        result = db.AQLQuery(aql, bindVars={'username': username}, rawResults=True)
        users = list(result)
        
        if not users:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        user = users[0]
        user.pop('password_hash', None)
        
        return jsonify({
            "success": True,
            "data": user
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@user_bp.route('/<username>', methods=['PUT'])
@require_permission('manage_users')
def update_user(username):
    """Update user (Admin only)"""
    try:
        data = request.get_json()
        db = db_connection.get_db()
        
        # Check if user exists
        aql_check = "FOR user IN users FILTER user.username == @username RETURN user"
        result = db.AQLQuery(aql_check, bindVars={'username': username}, rawResults=True)
        users = list(result)
        
        if not users:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Update user
        data['updated_at'] = datetime.now().isoformat()
        
        # If password is being updated, hash it
        if 'password' in data:
            user = User(username='temp', email='temp@temp.com', password=data['password'], full_name='temp')
            data['password_hash'] = user.password_hash
            del data['password']
        
        aql_update = """
        FOR user IN users
            FILTER user.username == @username
            UPDATE user WITH @data IN users
            RETURN NEW
        """
        
        result = db.AQLQuery(aql_update, bindVars={'username': username, 'data': data}, rawResults=True)
        updated_user = list(result)[0]
        updated_user.pop('password_hash', None)
        
        return jsonify({
            "success": True,
            "message": "User updated successfully",
            "data": updated_user
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@user_bp.route('/<username>', methods=['DELETE'])
@require_permission('manage_users')
def delete_user(username):
    """Delete user (Admin only)"""
    try:
        db = db_connection.get_db()
        
        # Check if user exists
        aql_check = "FOR user IN users FILTER user.username == @username RETURN user"
        result = db.AQLQuery(aql_check, bindVars={'username': username}, rawResults=True)
        users = list(result)
        
        if not users:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Delete user
        aql_delete = "FOR user IN users FILTER user.username == @username REMOVE user IN users"
        db.AQLQuery(aql_delete, bindVars={'username': username})
        
        return jsonify({
            "success": True,
            "message": "User deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500