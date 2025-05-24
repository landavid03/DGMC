# app/routes/__init__.py
from flask import Blueprint
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.vehicles import vehicles_bp
from app.routes.personal_info import personal_info_bp
from app.routes.emergency_contacts import contacts_bp
from app.routes.insurance_policies import policies_bp
from app.routes.vehicle_images import images_bp

api_bp = Blueprint('api', __name__)

def register_routes(app):
    """Registra todas las rutas en la aplicación Flask"""
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(personal_info_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(policies_bp)
    app.register_blueprint(images_bp)

    return app
