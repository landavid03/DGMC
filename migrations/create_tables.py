# migrations/create_tables.py
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.services.db_client import db
from app.models.user import User
from app.models.personal_info import PersonalInfo
from app.models.emergency_contact import EmergencyContact
from app.models.vehicle import Vehicle
from app.models.insurance_policy import InsurancePolicy
from app.models.vehicle_image import VehicleImage
from werkzeug.security import generate_password_hash

def create_tables():
    """Crea todas las tablas en la base de datos"""
    app = create_app('development')
    with app.app_context():
        db.create_all()

        # Crear usuario admin por defecto si no existe
        admin = User.query.filter_by(email='admin@example.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@example.com',
                role='admin'
            )
            admin.set_password('admin')
            db.session.add(admin)
            db.session.commit()
            print("Usuario administrador creado con éxito")

        print("Tablas creadas con éxito")

if __name__ == '__main__':
    create_tables()
