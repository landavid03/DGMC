from flask import Blueprint, request, jsonify
from app.models import user
from app.models.vehicle import Vehicle
from app.utils.auth import token_required, admin_required, monitor_required
from app.schemas.vehicle import VehiclesSchema,VehicleSchema
from app.services.db_client import db
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename
from flask import current_app
from app.clients.drive import ensure_folder_path, upload_file_to_folder,delete_file
import uuid
import os
from app.models.vehicle_image import VehicleImage
from app.schemas.vehicle_image import VehicleImageSchema, VehiclesImageSchema


from PIL import Image
from io import BytesIO

def compress_image(file_stream, mime_type, max_size=(1920, 1920), quality=80):
    image = Image.open(file_stream)

    # Convertir a RGB si es necesario (PNG con alpha, etc.)
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Redimensionar manteniendo proporción
    image.thumbnail(max_size)

    output = BytesIO()

    if mime_type in ("image/jpeg", "image/jpg"):
        image.save(output, format="JPEG", quality=quality, optimize=True)
        new_mime = "image/jpeg"
        ext = ".jpg"
    else:
        # PNG optimizado
        image.save(output, format="PNG", optimize=True)
        new_mime = "image/png"
        ext = ".png"

    output.seek(0)
    return output, new_mime, ext


vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')


ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Verificar si el archivo tiene una extensión permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_file(file):
    """Validar archivo subido"""
    if not file or file.filename == '':
        return False, "No se seleccionó archivo"
    
    if not allowed_file(file.filename):
        return False, "Tipo de archivo no permitido. Solo se aceptan: PNG, JPG, JPEG"
    
    # Verificar tamaño (esto es aproximado, el tamaño real se verifica en el frontend)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Regresar al inicio del archivo
    
    if file_size > MAX_FILE_SIZE:
        return False, "El archivo excede el tamaño máximo permitido (10MB)"
    
    return True, "Archivo válido"


import re

def convert_drive_url_to_direct(url: str) -> str:
    if not url:
        return url

    patterns = [
        r"https://drive\.google\.com/file/d/([^/]+)",
        r"https://drive\.google\.com/open\?id=([^&]+)",
        r"https://drive\.google\.com/uc\?export=view&id=([^&]+)",
        r"https://drive\.google\.com/uc\?id=([^&]+)"
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            file_id = match.group(1)
            return f"https://lh3.googleusercontent.com/d/{file_id}"

    return url

@vehicles_bp.route('/', methods=['GET'])
@monitor_required
def get_all_vehicles():
    vehicles = Vehicle.query.all()
    return jsonify({
        'success': True,
        'vehicles': VehiclesSchema.dump(vehicles)
    }), 200

@vehicles_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_vehicles(user_id):
    # Verificar permisos
    print("Get Vehicle by ID")
    current_user = get_jwt_identity()
    if current_user['role'] == 'user' and current_user['id'] != user_id:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    vehicles = Vehicle.query.filter_by(user_id=user_id).all()
    print("Vehicles: ", vehicles)

    for vehicle in vehicles:
        img = VehicleImage.query.filter_by(vehicle_id=vehicle.id).all()
        if(img):
            vehicle.image = convert_drive_url_to_direct(img[0].image_path)
    return jsonify({
        'success': True,
        'vehicles': VehiclesSchema.dump(vehicles)
    }), 200

@vehicles_bp.route('/<int:vehicle_id>', methods=['GET'])
@token_required
def get_vehicle(vehicle_id):
    current_user = get_jwt_identity()
    vehicle = Vehicle.query.get(vehicle_id)

    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    return jsonify({
        'success': True,
        'vehicle': VehiclesSchema.dump(vehicle)
    }), 200

@vehicles_bp.route('/', methods=['POST'])
@token_required
def create_vehicle():
    current_user = get_jwt_identity()
    
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()


    # Validar datos
    if not 'make' in data or not 'model' in data or not 'year' in data or not 'color' in data:
        return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400

    # Si es un usuario normal, solo puede crear vehículos para sí mismo
    if current_user['role'] == 'user':
        user_id = current_user['id']
    # Si es admin o monitor, puede especificar el usuario
    else:
        user_id = data.get('user_id', current_user['id'])

    if 'vehicle_files' in request.files:
        #policy_file = request.files['vehicle_file']
        files = request.files.getlist('vehicle_files')
        paths = []
        for policy_file in files:
            if policy_file and policy_file.filename != '':
                # Validar archivo
                is_valid, message = validate_file(policy_file)
                if not is_valid:
                    return jsonify({'success': False, 'message': message}), 400

                try:
                    # Generar nombre único
                    original_filename = secure_filename(policy_file.filename)
                    file_extension = original_filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"vehicle_{data['model']}_{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"

                    compressed_stream, new_mime, ext = compress_image(
                        policy_file.stream,
                        policy_file.mimetype
                    )


                    # Crear/obtener carpeta en Drive
                    service = current_app.config["GDRIVE_SERVICE"]
                    folder_id = ensure_folder_path(service, ["Vehicles", f"user_{user_id}"])
                    uploaded = upload_file_to_folder(
                        service,
                        compressed_stream,
                        unique_filename,
                        new_mime,
                        folder_id
                    )
                    #uploaded = upload_file_to_folder(service, policy_file.stream, unique_filename, policy_file.mimetype, folder_id)
                    drive_file_id = uploaded["id"]
                    file_url = uploaded.get("webViewLink") or uploaded.get("webContentLink")
                    paths.append(file_url)  # guarda el ID en tu campo file_path (o crea un campo dedicated)

                    print(f"Archivo subido a Drive: id={drive_file_id}, url={file_url}")

                except Exception as e:
                    print(f"Error subiendo archivo a Drive: {str(e)}")
                    return jsonify({
                        'success': False,
                        'message': f'Error subiendo archivo a Drive: {str(e)}'
                    }), 500

    new_vehicle = Vehicle(
        description=data.get('description', ''),
        make=data['make'],
        color=data['color'],
        license_plate=data['license_plate',''],
        model=data['model'],
        year=data['year',''],
        vin=data['vin',''],
        notes=data.get('notes', ''),
        user_id=data['user_id']
    )
    vehicle_schema = VehicleSchema()

    db.session.add(new_vehicle)
    db.session.commit()

    for file in paths:
        new_image = VehicleImage(
            vehicle_id=new_vehicle.id,
            image_path=file,
            description=""
        )

        db.session.add(new_image)
    db.session.commit()



    return jsonify({
        'success': True,
        'message': 'Vehículo creado correctamente',
        'vehicle': vehicle_schema.dump(new_vehicle)
    }), 201

@vehicles_bp.route('/<int:vehicle_id>', methods=['PUT'])
@token_required
def update_vehicle(vehicle_id):
    current_user = get_jwt_identity()
    vehicle = Vehicle.query.get(vehicle_id)

    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()

    # Actualizar campos
    if 'make' in data:
        vehicle.make = data['make']
    if 'model' in data:
        vehicle.model = data['model']
    if 'year' in data:
        vehicle.year = data['year']
    if 'color' in data:
        vehicle.color = data['color']
    if 'license_plate' in data:
        vehicle.license_plate = data['license_plate']
    if 'vin' in data:
        vehicle.vin = data['vin']
    if 'notes' in data:
        vehicle.notes = data['notes']   
    if 'description' in data:
        vehicle.description = data['description']

    db.session.commit()
    vehicle_schema = VehicleSchema()

    return jsonify({
        'success': True,
        'message': 'Vehículo actualizado correctamente',
        'vehicle': vehicle_schema.dump(vehicle)
    }), 200

@vehicles_bp.route('/<int:vehicle_id>', methods=['DELETE'])
@token_required
def delete_vehicle(vehicle_id):
    current_user = get_jwt_identity()
    vehicle = Vehicle.query.get(vehicle_id)

    if not vehicle:
        return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    # Si es admin, puede eliminar cualquier vehículo
    # Si es monitor o usuario, solo puede eliminar vehículos propios
    if current_user['role'] != 'admin' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    db.session.delete(vehicle)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Vehículo eliminado correctamente'
    }), 200
