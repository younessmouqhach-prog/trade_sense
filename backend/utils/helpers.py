from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import User

def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    if user_id:
        return User.query.get(user_id)
    return None

def require_role(*roles):
    """Decorator to require specific user roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            if user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator to require admin role"""
    return require_role('admin', 'superadmin')(f)

def superadmin_required(f):
    """Decorator to require superadmin role"""
    return require_role('superadmin')(f)
