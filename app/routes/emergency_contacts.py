from flask import Blueprint, request, jsonify
from app.models.emergency_contact import EmergencyContact
from app.utils.auth import token_required, admin_required, monitor_required
from app.schemas.emergency_contact import EmergencyContactSchema, EmergencyContactsSchema
from app.services.db_client import db
from flask_jwt_extended import get_jwt_identity

contacts_bp = Blueprint('emergency_contacts', __name__, url_prefix='/api/emergency-contacts')

@contacts_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_contacts(user_id):
    # Verificar permisos
    print("Get contacts by user ID")
    current_user = get_jwt_identity()
    if current_user['role'] == 'user' and current_user['id'] != user_id:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    contacts = EmergencyContact.query.filter_by(user_id=user_id).all()
    print(contacts)
    return jsonify({
        'success': True,
        'contacts': EmergencyContactsSchema.dump(contacts)
    }), 200

@contacts_bp.route('/', methods=['POST'])
@token_required
def create_contact():
    current_user = get_jwt_identity()
    data = request.get_json()

    # Validar datos
    if not 'name' in data or not 'phone_number' in data or not 'relationship' in data:
        return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400

    # Si es un usuario normal, solo puede crear contactos para sí mismo
    if current_user['role'] == 'user':
        user_id = current_user['id']
    # Si es admin o monitor, puede especificar el usuario
    else:
        user_id = data.get('user_id', current_user['id'])

    new_contact = EmergencyContact(
    user_id=user_id,
    name=data.get('name', ''),
    relationship=data.get('relationship', ''),
    phone_number=data.get('phone_number', ''),
    alternative_phone=data.get('alternative_phone'),
    email=data.get('email'),
    notes=data.get('notes')
    )

    db.session.add(new_contact)
    db.session.commit()
    emergency_contact_schema = EmergencyContactSchema()

    return jsonify({
        'success': True,
        'message': 'Contacto de emergencia creado correctamente',
        'contact': emergency_contact_schema.dump(new_contact)
    }), 201

@contacts_bp.route('/<int:contact_id>', methods=['PUT'])
@token_required
def update_contact(contact_id):
    current_user = get_jwt_identity()
    contact = EmergencyContact.query.get(contact_id)

    if not contact:
        return jsonify({'success': False, 'message': 'Contacto no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and contact.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    data = request.get_json()

    # Actualizar campos
    if 'name' in data:
        contact.name = data['name']
    if 'phone' in data:
        contact.phone = data['phone']
    if 'relationship' in data:
        contact.relationship = data['relationship']
    if 'phone_number' in data:
        contact.phone_number = data['phone_number']
    if 'alternative_phone' in data:
        contact.alternative_phone = data['alternative_phone']
    if 'email' in data:
        contact.email = data['email']
    if 'notes' in data:
        contact.notes = data['notes']   

    db.session.commit()
    emergency_contact_schema = EmergencyContactSchema()

    return jsonify({
        'success': True,
        'message': 'Contacto actualizado correctamente',
        'contact': emergency_contact_schema.dump(contact)
    }), 200

@contacts_bp.route('/<int:contact_id>', methods=['DELETE'])
@token_required
def delete_contact(contact_id):
    current_user = get_jwt_identity()
    contact = EmergencyContact.query.get(contact_id)

    if not contact:
        return jsonify({'success': False, 'message': 'Contacto no encontrado'}), 404

    # Verificar permisos
    if current_user['role'] == 'user' and contact.user_id != current_user['id']:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403

    db.session.delete(contact)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Contacto eliminado correctamente'
    }), 200
