import os
from datetime import timedelta

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'club_api_secret_key')
    DEBUG = False
    TESTING = False

    # SQLite configuration (local development)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///club.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_secret_key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Google Cloud Storage settings
    GCS_BUCKET_NAME = os.environ.get('GCS_BUCKET_NAME', 'club_api_files')
    GOOGLE_APPLICATION_CREDENTIALS = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'gcp-credentials.json')

    # Cloud SQL configuration (production)
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASS = os.environ.get('DB_PASS', 'password')
    DB_NAME = os.environ.get('DB_NAME', 'club')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')

    # Swagger settings
    SWAGGER_URL = '/api/docs'
    API_URL = '/static/swagger.json'

    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

class DevelopmentConfig(Config):
    DEBUG = True
    # Use SQLite for development
    SQLALCHEMY_DATABASE_URI = 'sqlite:///club.db'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

class ProductionConfig(Config):

    driver = "ODBC Driver 17 for SQL Server"

    if os.environ.get("DB_HOST"):
        # Producción en Cloud Run
        self.SQLALCHEMY_DATABASE_URI = (
            f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASS}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            f"?driver={driver}"
        )
    else:
        # Desarrollo local
        self.SQLALCHEMY_DATABASE_URI = (
            f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASS}"
            f"@localhost:{self.DB_PORT}/{self.DB_NAME}"
            f"?driver={driver}"
        )

    # # Use Cloud SQL for production
    # def __init__(self):
    #     if os.environ.get('DB_SOCKET_DIR', None):
    #         # Cloud Run environment
    #         instance_connection_name = os.environ.get('INSTANCE_CONNECTION_NAME')
    #         socket_dir = os.environ.get('DB_SOCKET_DIR', '/cloudsql')
    #         cloud_sql_connection_name = f"{socket_dir}/{instance_connection_name}"
    #         self.SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{self.DB_USER}:{self.DB_PASS}@/{self.DB_NAME}?unix_socket={cloud_sql_connection_name}"
    #     else:
    #         # Direct connection (for development of production environment)
    #         self.SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}/{self.DB_NAME}"

# Select configuration based on environment
config_dict = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    env = os.environ.get('FLASK_ENV', 'default')
    return config_dict.get(env)
