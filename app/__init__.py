from flask import Flask, jsonify
from flask_swagger_ui import get_swaggerui_blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.services.cloud_storage_client import CloudStorageClient
import json
# Initialize SQLAlchemy
db = SQLAlchemy()
# Initialize JWT
jwt = JWTManager()

cloud_storage_client = CloudStorageClient()

# Import config after db to avoid circular imports
from app.config import get_config

def log_endpoints(app):
    print("\n📡 Endpoints disponibles:")
    for rule in app.url_map.iter_rules():
        methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
        print(f"{methods:10} {rule.rule}")


def create_app(config_name='development'):
    """Initialize the Flask application"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(get_config())

    cloud_storage_client.init_app(app)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints
    register_blueprints(app)

    # Configure Swagger UI
    swagger_blueprint = get_swaggerui_blueprint(
        app.config['SWAGGER_URL'],
        app.config['API_URL'],
        config={
            'app_name': "Club API"
        }
    )
    app.register_blueprint(swagger_blueprint, url_prefix=app.config['SWAGGER_URL'])
    log_endpoints(app)

    # Create a route to serve the Swagger JSON
    @app.route('/static/swagger.json')
    def swagger():
        with open('app/static/swagger.json') as f:
            data = json.load(f)
            return jsonify(data)
    return app

def register_blueprints(app):
    """Register all blueprints for application"""
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.vehicles import vehicles_bp
    from app.routes.personal_info import personal_info_bp
    from app.routes.emergency_contacts import contacts_bp
    from app.routes.insurance_policies import policies_bp
    from app.routes.vehicle_images import images_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(vehicles_bp, url_prefix='/api/vehicles')
    app.register_blueprint(personal_info_bp, url_prefix='/api/personal-info')
    app.register_blueprint(contacts_bp, url_prefix='/api/emergency-contacts')
    app.register_blueprint(policies_bp, url_prefix='/api/insurance-policies')
    app.register_blueprint(images_bp, url_prefix='/api/vehicle-images')

def register_error_handlers(app):
    """Register error handlers for application"""

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': str(error)
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource'
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'Something went wrong on the server'
        }), 500

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token Expired',
            'message': 'The token has expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'Invalid Token',
            'message': 'Signature verification failed'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'error': 'Authorization Required',
            'message': 'Request does not contain an access token'
        }), 401
