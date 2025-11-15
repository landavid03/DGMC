# Imagen base ligera
FROM python:3.12-slim

# Evita cache de pip y setea UTF-8
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Instala dependencias mínimas necesarias para compilar (si no tienes dependencias nativas puedes quitar build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Crea usuario no-root
RUN useradd -m -u 1001 appuser

WORKDIR /app

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiar el código
COPY . .

# Puerto para Cloud Run (informativo)
ENV PORT=8080
EXPOSE 8080
RUN chown -R appuser:appuser /app

# Cambiar al usuario no-root
USER appuser

# Arranque simple con Python (asegúrate de que run.py tenga el if __name__ == "__main__")
CMD ["python", "run.py"]
