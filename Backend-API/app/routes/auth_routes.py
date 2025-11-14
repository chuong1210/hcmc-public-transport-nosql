from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import datetime, timedelta
from app.utils.db_connection import db_connection
from app.models.user import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        db = db_connection.get_db()
        
        # Check if username exists
        aql = "FOR user IN users FILTER user.username == @username RETURN user"
        result = db.AQLQuery(aql, bindVars={'username': data['username']}, rawResults=True)
        if list(result):
            return jsonify({
                "success": False,
                "error": "Username already exists"
            }), 400
        
        # Check if email exists
        aql = "FOR user IN users FILTER user.email == @email RETURN user"
        result = db.AQLQuery(aql, bindVars={'email': data['email']}, rawResults=True)
        if list(result):
            return jsonify({
                "success": False,
                "error": "Email already exists"
            }), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            role=data.get('role', 'user'),
            phone=data.get('phone', '')
        )
        
        # Save to database
        collection = db_connection.get_collection('users')
        doc = collection.createDocument(user.to_dict(include_password=True))
        doc.save()
        
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "data": user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({
                "success": False,
                "error": "Username and password are required"
            }), 400
        
        db = db_connection.get_db()
        
        # Find user
        aql = "FOR user IN users FILTER user.username == @username RETURN user"
        result = db.AQLQuery(aql, bindVars={'username': data['username']}, rawResults=True)
        users = list(result)
        
        if not users:
            return jsonify({
                "success": False,
                "error": "Invalid username or password"
            }), 401
        
        user_data = users[0]
        user = User.from_dict(user_data)
        
        # Check password
        if not user.check_password(data['password']):
            return jsonify({
                "success": False,
                "error": "Invalid username or password"
            }), 401
        
        # Check if user is active
        if user.status != 'active':
            return jsonify({
                "success": False,
                "error": "Account is not active"
            }), 401
        
        # Update last login
        aql_update = """
        FOR user IN users
            FILTER user.username == @username
            UPDATE user WITH { last_login: @last_login } IN users
        """
        db.AQLQuery(aql_update, bindVars={
            'username': data['username'],
            'last_login': datetime.now().isoformat()
        })
        
        # Create tokens
        additional_claims = {
            "role": user.role,
            "permissions": user.permissions
        }
        
        access_token = create_access_token(
            identity=user.username,
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=1)
        )
        
        refresh_token = create_refresh_token(
            identity=user.username,
            expires_delta=timedelta(days=30)
        )
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "data": {
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        identity = get_jwt_identity()
        
        db = db_connection.get_db()
        aql = "FOR user IN users FILTER user.username == @username RETURN user"
        result = db.AQLQuery(aql, bindVars={'username': identity}, rawResults=True)
        users = list(result)
        
        if not users:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        user_data = users[0]
        
        additional_claims = {
            "role": user_data['role'],
            "permissions": user_data['permissions']
        }
        
        access_token = create_access_token(
            identity=identity,
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=1)
        )
        
        return jsonify({
            "success": True,
            "access_token": access_token
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        identity = get_jwt_identity()
        
        db = db_connection.get_db()
        aql = "FOR user IN users FILTER user.username == @username RETURN user"
        result = db.AQLQuery(aql, bindVars={'username': identity}, rawResults=True)
        users = list(result)
        
        if not users:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        user = User.from_dict(users[0])
        
        return jsonify({
            "success": True,
            "data": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should delete token)"""
    return jsonify({
        "success": True,
        "message": "Logout successful"
    }), 200