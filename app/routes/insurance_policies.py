from flask import Blueprint, request, jsonify
from app.models.insurance_policy import InsurancePolicy
from app.models.vehicle import Vehicle
from app.utils.auth import token_required, admin_required, monitor_required
from app.schemas.insurance_policy import InsurancePolicySchema, InsurancePolicysSchema
from app.services.db_client import db
from app import cloud_storage_client  # importa la instancia inicializada en __init__.py
from flask_jwt_extended import get_jwt_identity
import uuid

policies_bp = Blueprint('policies', __name__, url_prefix='/api/policies')

@policies_bp.route('/vehicle/<int:vehicle_id>', methods=['GET'])
@token_required
def get_vehicle_policy(vehicle_id):
    current_user = get_jwt_identity()

    # Primero verificar si el vehículo existe
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    policy = InsurancePolicy.query.filter_by(vehicle_id=vehicle_id).first()
    if not policy:
        return jsonify({'success': False, 'message': 'Póliza de seguro no encontrada'}), 404

    return jsonify({
        'success': True,
        'policy': InsurancePolicySchema().dump(policy)
    }), 200

@policies_bp.route('/', methods=['POST'])
@token_required
def create_policy():
    current_user = get_jwt_identity()

    # Verificar si se envió un archivo
    if 'policy_file' not in request.files:
        return jsonify({'success': False, 'message': 'No se envió archivo de póliza'}), 400

    policy_file = request.files['policy_file']
    if policy_file.filename == '':
        return jsonify({'success': False, 'message': 'No se seleccionó archivo'}), 400

    # Obtener datos del formulario
    vehicle_id = request.form.get('vehicle_id')
    policy_number = request.form.get('policy_number')
    expiration_date = request.form.get('expiration_date')
    insurer = request.form.get('insurer')

    if not vehicle_id or not policy_number or not expiration_date or not insurer:
        return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400

    # Verificar si el vehículo existe y pertenece al usuario
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    # Subir archivo a Google Cloud Storage
    unique_filename = f"policies/{vehicle.user_id}/{uuid.uuid4()}_{policy_file.filename}"
    file_url = cloud_storage_client.upload_file(policy_file, folder=f"policies/{vehicle.user_id}")

    # Crear la póliza en la base de datos
    new_policy = InsurancePolicy(
        vehicle_id=vehicle_id,
        policy_number=policy_number,
        expiration_date=expiration_date,
        insurer=insurer,
        file_url=file_url,
        file_path=unique_filename
    )

    db.session.add(new_policy)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Póliza de seguro creada correctamente',
        'policy': InsurancePolicySchema().dump(new_policy)
    }), 201

@policies_bp.route('/<int:policy_id>', methods=['PUT'])
@token_required
def update_policy(policy_id):
    current_user = get_jwt_identity()
    policy = InsurancePolicy.query.get(policy_id)

    if not policy:
        return jsonify({'success': False, 'message': 'Póliza no encontrada'}), 404

    # Verificar permisos mediante el vehículo asociado
    vehicle = Vehicle.query.get(policy.vehicle_id)
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    # Actualizar campos de texto
    if 'policy_number' in request.form:
        policy.policy_number = request.form.get('policy_number')
    if 'expiration_date' in request.form:
        policy.expiration_date = request.form.get('expiration_date')
    if 'insurer' in request.form:
        policy.insurer = request.form.get('insurer')

    # Actualizar archivo si se proporcionó uno nuevo
    if 'policy_file' in request.files and request.files['policy_file'].filename != '':
        policy_file = request.files['policy_file']

        # Eliminar archivo antiguo
        if policy.file_path:
            cloud_storage_client.delete_file(policy.file_path)

        # Subir nuevo archivo
        unique_filename = f"policies/{vehicle.user_id}/{uuid.uuid4()}_{policy_file.filename}"
        file_url = cloud_storage_client.upload_file(policy_file, folder=f"policies/{vehicle.user_id}")

        policy.file_url = file_url
        policy.file_path = unique_filename

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Póliza actualizada correctamente',
        'policy': InsurancePolicySchema().dump(policy)
    }), 200

@policies_bp.route('/<int:policy_id>', methods=['DELETE'])
@token_required
def delete_policy(policy_id):
    current_user = get_jwt_identity()
    policy = InsurancePolicy.query.get(policy_id)

    if not policy:
        return jsonify({'success': False, 'message': 'Póliza no encontrada'}), 404

    # Verificar permisos mediante el vehículo asociado
    vehicle = Vehicle.query.get(policy.vehicle_id)
    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo asociado no encontrado'}), 404

    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    # Eliminar archivo de Google Cloud Storage
    if policy.file_path:
        cloud_storage_client.delete_file(policy.file_path)

    db.session.delete(policy)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Póliza eliminada correctamente'
    }), 200
