from flask import Blueprint, request, jsonify
from app.models.user import User
from app.utils.auth import generate_token, token_required, admin_required, monitor_required
from app.schemas.user import UserSchema, UserLoginSchema
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    errors = UserLoginSchema().validate(data)
    if not errors:
        email = data['email']
        password = data['password_hash']

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            access_token = create_access_token(identity={
                'id': user.id,
                'email': user.email,
                'role': user.role
            })
            return jsonify({
                'success': True,
                'access_token': access_token,
                'user': UserSchema().dump(user)
            }), 200

    return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_user_profile():
    print("Headers:", request.headers)  # 👈 imprime los headers recibidos
    current_user_id = get_jwt_identity()["id"]
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

    return jsonify({
        'success': True,
        'user': UserSchema().dump(user)
    }), 200
