from flask import Blueprint, request, jsonify
from app.models.insurance_policy import InsurancePolicy
from app.models.vehicle import Vehicle
from app.models.user import User
from app.utils.auth import token_required, admin_required, monitor_required
from app.schemas.insurance_policy import InsurancePolicySchema, InsurancePolicysSchema
from app.services.db_client import db
from app import cloud_storage_client  # importa la instancia inicializada en __init__.py
from flask_jwt_extended import get_jwt_identity
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
import os
from flask import current_app
from app.clients.drive import ensure_folder_path, upload_file_to_folder,delete_file

policies_bp = Blueprint('policies', __name__, url_prefix='/api/policies')

# Configuración para archivos permitidos
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
        return False, "Tipo de archivo no permitido. Solo se aceptan: PDF, PNG, JPG, JPEG"
    
    # Verificar tamaño (esto es aproximado, el tamaño real se verifica en el frontend)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Regresar al inicio del archivo
    
    if file_size > MAX_FILE_SIZE:
        return False, "El archivo excede el tamaño máximo permitido (10MB)"
    
    return True, "Archivo válido"

@policies_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_policys(user_id):
    print("Get user policys ", user_id)
    current_user = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

    if current_user['role'] == 'user' and user.id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    policies = InsurancePolicy.query.filter_by(user_id=user_id).all()

    if not policies:
        return jsonify({'success': True, 'policies': []}), 200

    print(policies)
    print("Get user policys Done", user_id)

    return jsonify({
        'success': True,
        'policies': InsurancePolicysSchema.dump(policies)
    }), 200

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

@policies_bp.route('', methods=['POST'], strict_slashes=False)
@token_required
def create_policy():
    current_user = get_jwt_identity()
    
    try:
        # Obtener datos del formulario (FormData)
        company = request.form.get('company')
        policy_number = request.form.get('policy_number')
        coverage_type = request.form.get('coverage_type', '')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        notes = request.form.get('notes', '')
        vehicle_id = request.form.get('vehicle_id')
        user_id = request.form.get('user_id')

        # Validar campos requeridos
        if not all([company, policy_number, vehicle_id, start_date, end_date, user_id]):
            return jsonify({
                'success': False, 
                'message': 'Faltan campos requeridos: company, policy_number, vehicle_id, start_date, end_date'
            }), 400

        # Verificar si el vehículo existe y pertenece al usuario
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            return jsonify({'success': False, 'message': 'Vehículo no encontrado'}), 404

        # Verificar permisos
        if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
            return jsonify({'success': False, 'message': 'No autorizado'}), 403

                # Variables para el archivo
        file_url = None
        file_path = None  # aquí guardaremos el file_id de Drive
        drive_file_id = None

        if 'policy_file' in request.files:
            policy_file = request.files['policy_file']

            if policy_file and policy_file.filename != '':
                # Validar archivo
                is_valid, message = validate_file(policy_file)
                if not is_valid:
                    return jsonify({'success': False, 'message': message}), 400

                try:
                    # Generar nombre único
                    original_filename = secure_filename(policy_file.filename)
                    file_extension = original_filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"policy_{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"

                    # Crear/obtener carpeta en Drive
                    service = current_app.config["GDRIVE_SERVICE"]
                    folder_id = ensure_folder_path(service, ["insurance_policies", f"user_{user_id}"])
                    uploaded = upload_file_to_folder(service, policy_file.stream, unique_filename, policy_file.mimetype, folder_id)
                    drive_file_id = uploaded["id"]
                    file_url = uploaded.get("webViewLink") or uploaded.get("webContentLink")
                    file_path = drive_file_id  # guarda el ID en tu campo file_path (o crea un campo dedicated)

                    print(f"Archivo subido a Drive: id={drive_file_id}, url={file_url}")

                except Exception as e:
                    print(f"Error subiendo archivo a Drive: {str(e)}")
                    return jsonify({
                        'success': False,
                        'message': f'Error subiendo archivo a Drive: {str(e)}'
                    }), 500



        # Crear la póliza en la base de datos
        try:
            new_policy = InsurancePolicy(
                company=company,
                policy_number=policy_number,
                coverage_type=coverage_type,
                start_date=datetime.strptime(start_date, '%Y-%m-%d').date(),
                end_date=datetime.strptime(end_date, '%Y-%m-%d').date(),
                notes=notes,
                vehicle_id=int(vehicle_id),
                user_id=int(user_id),
                file_url=file_url,
                file_path=file_path
            )

            db.session.add(new_policy)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Póliza de seguro creada correctamente',
                'policy': InsurancePolicySchema().dump(new_policy)
            }), 201

        except Exception as e:
            # Si hay error al guardar en BD, eliminar archivo subido
            if file_path:
                try:
                    cloud_storage_client.delete_file(file_path)
                except:
                    pass
            
            db.session.rollback()
            print(f"Error creando póliza: {str(e)}")
            return jsonify({
                'success': False, 
                'message': f'Error creando póliza: {str(e)}'
            }), 500

    except Exception as e:
        print(f"Error general en create_policy: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@policies_bp.route('/<int:policy_id>', methods=['PUT'], strict_slashes=False)
@token_required
def update_policy(policy_id):
    print("update_policy")
    current_user = get_jwt_identity()
    policy = InsurancePolicy.query.get(policy_id)

    if not policy:
        return jsonify({'success': False, 'message': 'Póliza no encontrada'}), 404

    # Verificar permisos mediante el vehículo asociado
    vehicle = Vehicle.query.get(policy.vehicle_id)
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    try:
        # Obtener datos del formulario
        if request.form:
            # Actualizar campos de texto si están presentes
            if 'company' in request.form:
                policy.company = request.form['company']
            if 'policy_number' in request.form:
                policy.policy_number = request.form['policy_number']
            if 'coverage_type' in request.form:
                policy.coverage_type = request.form['coverage_type']
            if 'start_date' in request.form:
                policy.start_date = datetime.strptime(request.form['start_date'], '%Y-%m-%d').date()
            if 'end_date' in request.form:
                policy.end_date = datetime.strptime(request.form['end_date'], '%Y-%m-%d').date()
            if 'notes' in request.form:
                policy.notes = request.form['notes']
        else:
            # Fallback para JSON (si no se envía archivo)
            data = request.get_json()
            if 'company' in data:
                policy.company = data['company']
            if 'policy_number' in data:
                policy.policy_number = data['policy_number']
            if 'coverage_type' in data:
                policy.coverage_type = data['coverage_type']
            if 'start_date' in data:
                policy.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            if 'end_date' in data:
                policy.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            if 'notes' in data:
                policy.notes = data['notes']

        # Procesar nuevo archivo si se subió uno
        if 'policy_file' in request.files:
            policy_file = request.files['policy_file']
            
            if policy_file and policy_file.filename != '':
                # Validar archivo
                is_valid, message = validate_file(policy_file)
                if not is_valid:
                    return jsonify({'success': False, 'message': message}), 400

                try:
                    # Eliminar archivo antiguo si existe
                    if policy.file_path:  # aquí guardamos drive_file_id
                        try:
                            service = current_app.config["GDRIVE_SERVICE"]
                            delete_file(service, policy.file_path)
                            print(f"Archivo antiguo eliminado de Drive: {policy.file_path}")
                        except Exception as e:
                            print(f"Error eliminando archivo antiguo en Drive: {str(e)}")
                    # Generar nombre único para el nuevo archivo
                    original_filename = secure_filename(policy_file.filename)
                    file_extension = original_filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"policy_{vehicle.user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
                    
                    # Crear la ruta completa para el archivo en Google Drive
                    folder_path = f"insurance_policies/user_{vehicle.user_id}"
                    file_path = f"{folder_path}/{unique_filename}"
                    
                    service = current_app.config["GDRIVE_SERVICE"]
                    folder_id = ensure_folder_path(service, ["insurance_policies", f"user_{vehicle.user_id}"])
                    uploaded = upload_file_to_folder(service, policy_file.stream, unique_filename, policy_file.mimetype, folder_id)
                    drive_file_id = uploaded["id"]
                    file_url = uploaded.get("webViewLink") or uploaded.get("webContentLink")
                    file_path = drive_file_id  # guarda el ID en tu campo file_path (o crea un campo dedicated)

                    # Actualizar campos en la póliza
                    policy.file_url = file_url
                    policy.file_path = drive_file_id
                    
                    print(f"Nuevo archivo subido: {file_url}")
                    
                except Exception as e:
                    print(f"Error subiendo nuevo archivo: {str(e)}")
                    return jsonify({
                        'success': False, 
                        'message': f'Error subiendo archivo: {str(e)}'
                    }), 500

        # Guardar cambios en la base de datos
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Póliza actualizada correctamente',
            'policy': InsurancePolicySchema().dump(policy)
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error actualizando póliza: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error actualizando póliza: {str(e)}'
        }), 500

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

    try:
        # Eliminar archivo de Google Drive si existe
        if policy.file_path:
            try:
                service = current_app.config["GDRIVE_SERVICE"]
                delete_file(service, policy.file_path)
                print(f"Archivo eliminado de Drive: {policy.file_path}")
            except Exception as e:
                print(f"Error eliminando archivo de Drive: {str(e)}")

        # Eliminar póliza de la base de datos
        db.session.delete(policy)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Póliza eliminada correctamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando póliza: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error eliminando póliza: {str(e)}'
        }), 500

# Ruta adicional para obtener todas las pólizas (admin)
@policies_bp.route('/admin/all', methods=['GET'])
@token_required
@admin_required
def get_all_policies():
    """Obtener todas las pólizas (solo para administradores)"""
    try:
        policies = InsurancePolicy.query.join(Vehicle).join(User).all()
        
        # Serializar con información adicional
        policies_data = []
        for policy in policies:
            policy_dict = InsurancePolicySchema().dump(policy)
            # Agregar información del usuario y vehículo
            policy_dict['user_name'] = policy.user.name if hasattr(policy, 'user') else 'N/A'
            policy_dict['user_email'] = policy.user.email if hasattr(policy, 'user') else 'N/A'
            policy_dict['vehicle_info'] = f"{policy.vehicle.make} {policy.vehicle.model} ({policy.vehicle.year})" if hasattr(policy, 'vehicle') else 'N/A'
            policies_data.append(policy_dict)
        
        return jsonify({
            'success': True,
            'policies': policies_data,
            'total': len(policies_data)
        }), 200

    except Exception as e:
        print(f"Error obteniendo todas las pólizas: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error obteniendo pólizas: {str(e)}'
        }), 500

# Ruta para descargar archivo
@policies_bp.route('/<int:policy_id>/download', methods=['GET'])
@token_required
def download_policy_file(policy_id):
    """Generar URL de descarga temporal para el archivo de la póliza"""
    current_user = get_jwt_identity()
    policy = InsurancePolicy.query.get(policy_id)

    if not policy:
        return jsonify({'success': False, 'message': 'Póliza no encontrada'}), 404

    # Verificar permisos
    vehicle = Vehicle.query.get(policy.vehicle_id)
    if current_user['role'] == 'user' and vehicle.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    if not policy.file_path:
        return jsonify({'success': False, 'message': 'No hay archivo asociado a esta póliza'}), 404

    try:
        # Generar URL de descarga temporal (válida por 1 hora)
        download_url = cloud_storage_client.generate_download_url(
            policy.file_path, 
            expiration_time=3600  # 1 hora
        )
        
        return jsonify({
            'success': True,
            'download_url': download_url,
            'filename': f"{policy.company}_{policy.policy_number}.pdf"
        }), 200

    except Exception as e:
        print(f"Error generando URL de descarga: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error generando URL de descarga: {str(e)}'
        }), 500