from datetime import datetime
import bcrypt

class User:
    def __init__(self, username, email, password, full_name, 
                 role="user", permissions=None, phone="", status="active"):
        self.username = username
        self.email = email
        self.password_hash = self._hash_password(password)
        self.full_name = full_name
        self.role = role
        self.permissions = permissions or self._get_default_permissions(role)
        self.phone = phone
        self.status = status
        self.created_at = datetime.now().isoformat()
        self.last_login = None
    
    def _hash_password(self, password):
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def _get_default_permissions(self, role):
        """Get default permissions based on role"""
        role_permissions = {
            'admin': ['read', 'write', 'delete', 'manage_users', 'manage_routes', 'view_reports'],
            'manager': ['read', 'write', 'manage_routes', 'view_reports'],
            'user': ['read']
        }
        return role_permissions.get(role, ['read'])
    
    def to_dict(self, include_password=False):
        """Convert to dictionary"""
        data = {
            "_key": self.username,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "permissions": self.permissions,
            "phone": self.phone,
            "status": self.status,
            "created_at": self.created_at,
            "last_login": self.last_login
        }
        if include_password:
            data['password_hash'] = self.password_hash
        return data
    
    @staticmethod
    def from_dict(data):
        """Create User from dictionary"""
        user = User(
            username=data.get('username'),
            email=data.get('email'),
            password='',  # Will be set separately
            full_name=data.get('full_name'),
            role=data.get('role', 'user'),
            permissions=data.get('permissions'),
            phone=data.get('phone', ''),
            status=data.get('status', 'active')
        )
        user.password_hash = data.get('password_hash', '')
        user.created_at = data.get('created_at')
        user.last_login = data.get('last_login')
        return user