from flask import Blueprint, request, jsonify
from app.models.personal_info import PersonalInfo
from app.models.user import User
from app.utils.auth import token_required, admin_required, monitor_required
from app.schemas.personal_info import PersonalInfoSchema, PersonalInfosSchema
from app.services.db_client import db
from flask_jwt_extended import get_jwt_identity

personal_info_bp = Blueprint('personal_info', __name__, url_prefix='/api/personal-info')

@personal_info_bp.route('/', methods=['GET'])
@monitor_required
def get_all_personal_info():
    personal_infos = PersonalInfo.query.all()
    return jsonify({
        'success': True,
        'personal_info': PersonalInfosSchema.dump(personal_infos)
    }), 200

@personal_info_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_personal_info(user_id):
    # Verificar permisos
    print("ENTROOO")
    try:

        current_user = get_jwt_identity()
        if current_user['role'] == 'user' and current_user['id'] != user_id:
            return jsonify({'success': False, 'message': 'No autorizado'}), 403
        print(current_user)

        personal_info = PersonalInfo.query.filter_by(user_id=user_id).first()
        if not personal_info:
            return jsonify({'success': False, 'message': 'Información personal no encontrada'}), 404
        personal_info_schema = PersonalInfoSchema()

        return jsonify({
            'success': True,
            'personal_info': personal_info_schema.dump(personal_info)
        }), 200
    except Exception as e:
        print("error: ",e)
        return jsonify({
            'success': False,
            'personal_info': ''
        }), 400

@personal_info_bp.route('/', methods=['POST'])
@token_required
def create_personal_info():
    current_user = get_jwt_identity()
    data = request.get_json()
    print(data)
    # Verificar si el usuario ya tiene información personal
    existing_info = PersonalInfo.query.filter_by(user_id=current_user['id']).first()
    if existing_info:
        return jsonify({'success': False, 'message': 'Ya existe información personal para este usuario'}), 400

    # Validar datos
    if not 'age' in data or not 'blood_type' in data or not 'address' in data:
        return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400

    new_info = PersonalInfo(
        user_id=current_user['id'],
        age=data['age'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        blood_type=data['blood_type'],
        address=data['address'],
        allergies=data.get('allergies', '')
    )

    db.session.add(new_info)
    db.session.commit()
    emergency_contact_schema = PersonalInfoSchema()

    return jsonify({
        'success': True,
        'message': 'Información personal creada correctamente',
        'personal_info': emergency_contact_schema.dump(new_info)
    }), 201

@personal_info_bp.route('/<int:info_id>', methods=['PUT'])
@token_required
def update_personal_info(info_id):
    current_user = get_jwt_identity()
    personal_info = PersonalInfo.query.get(info_id)

    if not personal_info:
        return jsonify({'success': False, 'message': 'Información personal no encontrada'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and personal_info.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    data = request.get_json()

    # Actualizar campos
    # Actualizar dinámicamente los campos si existen en el modelo
    for key, value in data.items():
        if hasattr(personal_info, key):
            setattr(personal_info, key, value)

    db.session.commit()
    schema = PersonalInfoSchema()

    return jsonify({
        'success': True,
        'message': 'Información personal actualizada correctamente',
        'personal_info': schema.dump(personal_info)
    }), 200

@personal_info_bp.route('/<int:info_id>', methods=['DELETE'])
@admin_required
def delete_personal_info(info_id):
    personal_info = PersonalInfo.query.get(info_id)
    if not personal_info:
        return jsonify({'success': False, 'message': 'Información personal no encontrada'}), 404

    db.session.delete(personal_info)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Información personal eliminada correctamente'
    }), 200
