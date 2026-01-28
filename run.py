# run.py
import os
from app import create_app
from flask_cors import CORS
from flask import Flask, request, make_response

FRONTEND_ORIGINS = {
    "http://localhost:5555",
    "http://127.0.0.1:5555",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "*"
    # agrega aquí el dominio real de tu front si aplica, p.ej. "https://mi-front.com"
}
app = create_app(os.getenv('FLASK_ENV') or 'development')

CORS(
        app,
        resources={r"/api/*": {"origins": list(FRONTEND_ORIGINS)}},
        supports_credentials=True,
        # no forces allow_headers aquí; lo reflejamos abajo
)
@app.before_request
def cors_preflight():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin")
        # Solo responder CORS si el origin está permitido
        if origin and origin in FRONTEND_ORIGINS:
            resp = make_response("", 204)
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Vary"] = "Origin"
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            # Refleja exactamente lo que el browser pide
            acrh = request.headers.get("Access-Control-Request-Headers", "")
            if acrh:
                resp.headers["Access-Control-Allow-Headers"] = acrh
            else:
                resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            # Asegura incluir el método solicitado
            acrm = request.headers.get("Access-Control-Request-Method", "GET,POST,PUT,DELETE,OPTIONS")
            resp.headers["Access-Control-Allow-Methods"] = acrm if acrm else "GET, POST, PUT, DELETE, OPTIONS"
            resp.headers["Access-Control-Max-Age"] = "86400"
            return resp
        # Si no hay Origin o no está permitido, deja que responda normal (evita ruido)

# 3) Asegura que TODAS las respuestas tengan CORS correcto (incluye errores)
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and origin in FRONTEND_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        # No hace falta forzar Allow-Headers aquí en respuestas no-preflight,
        # pero no estorba:
        response.headers.setdefault("Access-Control-Allow-Headers", "Authorization, Content-Type")
        response.headers.setdefault("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    return response
app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5555)))


# Inicializar migraciones
#python manage.py db init

# Crear una migración basada en cambios del modelo
#python manage.py db migrate -m "inicial"

# Aplicar los cambios en la base de datos
#python manage.py db upgrade