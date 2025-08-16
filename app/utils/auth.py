from functools import wraps
from flask import request, jsonify, current_app, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User
from app import db
from datetime import datetime, timedelta
from app.config import Config

import jwt

def generate_token(user_id, username, role):
    """
    Genera un token JWT para un usuario
    """
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role.value,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

def token_required(f):
    """Decorator to require a valid JWT token"""

    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({"ok": True}), 204
        
        try:
            # Verify token
            print("Tratando de verificar auth")
            verify_jwt_in_request()

            # Get current user from token
            current_user_id = get_jwt_identity()["id"]
            current_user = User.query.get(current_user_id)
            print("Current_User: ",current_user_id)
            if not current_user:
                print("No se pudo verificar")
                return jsonify({'error': 'User not found'}), 404

            # Store current user in Flask g object
            g.current_user = current_user
            return f(*args, **kwargs)
        except Exception as e:
            print(e)
            return jsonify({'error': 'Token is invalid', 'message': str(e)}), 401
    return decorated

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token_result = token_required(lambda: None)()
        if isinstance(token_result, tuple) and token_result[1] != 200:
            return token_result

        if g.current_user.role != 'admin':
            return jsonify({'error': 'Admin privileges required'}), 403

        return f(*args, **kwargs)
    return decorated

def monitor_required(f):
    """Decorator to require monitor or admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token_result = token_required(lambda: None)()
        if isinstance(token_result, tuple) and token_result[1] != 200:
            return token_result

        if g.current_user.role not in ['admin', 'monitor']:
            return jsonify({'error': 'Monitor or admin privileges required'}), 403

        return f(*args, **kwargs)
    return decorated

def user_owner_required(user_id_param='user_id'):
    """Decorator to require the user to be the owner or an admin/monitor"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token_result = token_required(lambda: None)()
            if isinstance(token_result, tuple) and token_result[1] != 200:
                return token_result

            # Get user_id from URL parameter
            requested_user_id = kwargs.get(user_id_param)

            # If admin or monitor, allow access
            if g.current_user.role in ['admin', 'monitor']:
                return f(*args, **kwargs)

            # If regular user, check if they are accessing their own data
            if g.current_user.id != int(requested_user_id):
                return jsonify({'error': 'You can only access your own data'}), 403

            return f(*args, **kwargs)
        return decorated
    return decorator

def vehicle_owner_required(vehicle_id_param='vehicle_id'):
    """Decorator to require the user to be the owner of the vehicle or an admin/monitor"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            from app.models.vehicle import Vehicle

            token_result = token_required(lambda: None)()
            if isinstance(token_result, tuple) and token_result[1] != 200:
                return token_result

            # Get vehicle_id from URL parameter
            requested_vehicle_id = kwargs.get(vehicle_id_param)

            # If admin or monitor, allow access
            if g.current_user.role in ['admin', 'monitor']:
                return f(*args, **kwargs)

            # Check if the user owns the vehicle
            vehicle = Vehicle.query.get(requested_vehicle_id)
            if not vehicle:
                return jsonify({'error': 'Vehicle not found'}), 404

            if vehicle.user_id != g.current_user.id:
                return jsonify({'error': 'You can only access your own vehicles'}), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
