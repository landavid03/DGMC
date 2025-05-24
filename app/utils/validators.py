# app/utils/validators.py
import re

def validate_email(email):
    """Valida que el correo tenga un formato válido"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))

def validate_password(password):
    """Valida que la contraseña cumpla con los requisitos mínimos de seguridad"""
    # Al menos 6 caracteres, 1 letra y 1 número
    if len(password) < 6:
        return False
    if not re.search(r"[a-zA-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True
