from datetime import datetime
from app import db

class VehicleImage(db.Model):
    """Vehicle image model for storing references to images in Google Cloud Storage"""
    __tablename__ = 'vehicle_images'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)  # Path in Google Cloud Storage
    description = db.Column(db.String(255), nullable=True)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert vehicle image to dictionary"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'image_path': self.image_path,
            'description': self.description,
            'is_primary': self.is_primary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<VehicleImage {self.id} for vehicle {self.vehicle_id}>'
