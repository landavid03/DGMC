from flask import Blueprint, request, jsonify
from app.models.user import User
from app.utils.auth import token_required, admin_required
from app.schemas.user import UserSchema, UsersSchema, UserCreateSchema, UserUpdateSchema
from werkzeug.security import generate_password_hash
from app.services.db_client import db
from flask_jwt_extended import jwt_required, get_jwt_identity

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify({
        'success': True,
        'users': UsersSchema.dump(users)
    }), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    # Verificar si el usuario actual puede ver este usuario
    current_user = get_jwt_identity()
    if current_user['role'] == 'user' and current_user['id'] != user_id:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

    return jsonify({
        'success': True,
        'user': UserSchema().dump(user)
    }), 200

@users_bp.route('/', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json()

    if not UserCreateSchema.validate(data):
        # Verificar si el correo ya existe
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'El correo ya está registrado'}), 400

        # Crear usuario
        new_user = User(
            username=data['username'],
            email=data['email'],
            role=data['role']
        )
        new_user.set_password(data['password_hash'])

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Usuario creado exitosamente',
            'user': UserSchema().dump(new_user)
        }), 201
    else:
        return jsonify({'success': False, 'message': 'Datos inválidos', 'errors': 'UserCreateSchema.errors'}), 400

@users_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    # Verificar permisos
    current_user = get_jwt_identity()
    if current_user['role'] == 'user' and current_user['id'] != user_id:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

    data = request.get_json()
    if not UserUpdateSchema.validate(data):
        # Actualizar campos
        if 'name' in data:
            user.name = data['name']
        if 'email' in data and current_user['role'] == 'admin':  # Solo admin puede cambiar email
            user.email = data['email']
        if 'password' in data:
            user.password = generate_password_hash(data['password'])
        if 'role' in data and current_user['role'] == 'admin':  # Solo admin puede cambiar rol
            user.role = data['role']

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Usuario actualizado correctamente',
            'user': UserSchema().dump(user)
        }), 200
    else:
        return jsonify({'success': False, 'message': 'Datos inválidos', 'errors': 'UserUpdateSchema.errors'}), 400

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Usuario {user.email} eliminado correctamente'
    }), 200
