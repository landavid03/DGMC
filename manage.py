# manage.py
from app import create_app, db
from flask_migrate import Migrate
from flask.cli import FlaskGroup
import os

app = create_app(os.getenv('FLASK_ENV') or 'development')

migrate = Migrate(app, db)

cli = FlaskGroup(create_app=create_app)

if __name__ == '__main__':
    cli()


# Inicializar migraciones
#python manage.py db init

# Crear una migración basada en cambios del modelo
#python manage.py db migrate -m "inicial"

# Aplicar los cambios en la base de datos
#python manage.py db upgrade