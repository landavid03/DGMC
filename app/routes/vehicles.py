from flask import Blueprint, request, jsonify
from app.models.vehicle import Vehicle
from app.utils.auth import token_required, admin_required, monitor_required
from app.schemas.vehicle import VehiclesSchema,VehicleSchema
from app.services.db_client import db
from flask_jwt_extended import get_jwt_identity

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

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

    new_vehicle = Vehicle(
        description=data.get('description', ''),
        make=data['make'],
        color=data['color'],
        license_plate=data['license_plate'],
        model=data['model'],
        year=data['year'],
        vin=data['vin'],
        notes=data.get('notes', ''),
        user_id=data['user_id']
    )
    vehicle_schema = VehicleSchema()

    db.session.add(new_vehicle)
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
