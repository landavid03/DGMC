from flask import Blueprint, request, jsonify
from app.models.vehicle_image import VehicleImage
from app.models.vehicle import Vehicle
from app.utils.auth import token_required, admin_required, monitor_required
from app.schemas.vehicle_image import VehicleImageSchema, VehiclesImageSchema
from app.services.db_client import db
from app import cloud_storage_client  # importa la instancia inicializada en __init__.py
from flask_jwt_extended import get_jwt_identity
import uuid

images_bp = Blueprint('vehicle_images', __name__, url_prefix='/api/vehicle-images')

@images_bp.route('/vehicle/<int:vehicle_id>', methods=['GET'])
@token_required
def get_vehicle_images(vehicle_id):
    current_user = get_jwt_identity()

    # Verificar si el vehículo existe
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    images = VehicleImage.query.filter_by(vehicle_id=vehicle_id).all()

    return jsonify({
        'success': True,
        'images': VehiclesImageSchema.dump(images)
    }), 200

@images_bp.route('/', methods=['POST'])
@token_required
def upload_vehicle_image():
    current_user = get_jwt_identity()

    # Verificar si se envió un archivo
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No se envió imagen'}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'success': False, 'message': 'No se seleccionó archivo'}), 400
        # Obtener datos del formulario
    vehicle_id = request.form.get('vehicle_id')
    description = request.form.get('description', '')

    if not vehicle_id:
        return jsonify({'success': False, 'message': 'Falta el ID del vehículo'}), 400

    # Verificar si el vehículo existe y pertenece al usuario
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    # Validar tipo de archivo (imagen)
    if not image_file.content_type.startswith('image/'):
        return jsonify({'success': False, 'message': 'El archivo debe ser una imagen'}), 400

    # Subir archivo a Google Cloud Storage
    unique_filename = f"vehicle_images/{vehicle.user_id}/{vehicle_id}/{uuid.uuid4()}_{image_file.filename}"
    image_url = cloud_storage_client.upload_file(image_file, folder=f"vehicle_images/{unique_filename}")

    # Crear registro en la base de datos
    new_image = VehicleImage(
        vehicle_id=vehicle_id,
        image_url=image_url,
        image_path=unique_filename,
        description=description
    )

    db.session.add(new_image)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Imagen subida correctamente',
        'image': VehicleImageSchema().dump(new_image)
    }), 201

@images_bp.route('/<int:image_id>', methods=['PUT'])
@token_required
def update_vehicle_image(image_id):
    current_user = get_jwt_identity()
    image = VehicleImage.query.get(image_id)

    if not image:
        return jsonify({'success': False, 'message': 'Imagen no encontrada'}), 404

    # Verificar permisos mediante el vehículo asociado
    vehicle = Vehicle.query.get(image.vehicle_id)
    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo asociado no encontrado'}), 404

    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    # Actualizar descripción
    if 'description' in request.form:
        image.description = request.form.get('description')

    # Actualizar imagen si se proporcionó una nueva
    if 'image' in request.files and request.files['image'].filename != '':
        image_file = request.files['image']

        # Validar tipo de archivo (imagen)
        if not image_file.content_type.startswith('image/'):
            return jsonify({'success': False, 'message': 'El archivo debe ser una imagen'}), 400

        # Eliminar imagen antigua
        if image.image_path:
            cloud_storage_client.delete_file(image.image_path)

        # Subir nueva imagen
        unique_filename = f"vehicle_images/{vehicle.user_id}/{vehicle.id}/{uuid.uuid4()}_{image_file.filename}"

        image_url = cloud_storage_client.upload_file(image_file, folder=f"vehicle_images/{unique_filename}")

        image.image_url = image_url
        image.image_path = unique_filename

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Imagen actualizada correctamente',
        'image': VehicleImageSchema().dump(image)
    }), 200

@images_bp.route('/<int:image_id>', methods=['DELETE'])
@token_required
def delete_vehicle_image(image_id):
    current_user = get_jwt_identity()
    image = VehicleImage.query.get(image_id)

    if not image:
        return jsonify({'success': False, 'message': 'Imagen no encontrada'}), 404

    # Verificar permisos mediante el vehículo asociado
    vehicle = Vehicle.query.get(image.vehicle_id)
    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo asociado no encontrado'}), 404

    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    # Eliminar archivo de Google Cloud Storage
    if image.image_path:
        cloud_storage_client.delete_file(image.image_path)

    db.session.delete(image)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Imagen eliminada correctamente'
    }), 200
