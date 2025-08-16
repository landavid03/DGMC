from datetime import datetime
from app import db

class InsurancePolicy(db.Model):
    """Insurance policy model for club members' vehicles"""
    __tablename__ = 'insurance_policies'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    policy_number = db.Column(db.String(50), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    coverage_type = db.Column(db.String(50), nullable=True)
    pdf_file_path = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    file_url = db.Column(db.String(500), nullable=True)  # URL del archivo en Google Drive
    file_path = db.Column(db.String(300), nullable=True)  # Ruta del archivo en Google Drive
    

    def to_dict(self):
        """Convert insurance policy to dictionary"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'user_id': self.user_id,
            'policy_number': self.policy_number,
            'company': self.company,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'coverage_type': self.coverage_type,
            'pdf_file_path': self.pdf_file_path,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<InsurancePolicy {self.policy_number} for vehicle {self.vehicle_id}>'
    @property
    def has_file(self):
        """Verificar si la póliza tiene un archivo asociado"""
        return bool(self.file_url and self.file_path)
    
    @property
    def is_expired(self):
        """Verificar si la póliza está vencida"""
        from datetime import date
        return self.end_date < date.today() if self.end_date else False
    
    @property
    def days_to_expire(self):
        """Calcular días hasta el vencimiento"""
        from datetime import date
        if self.end_date:
            delta = self.end_date - date.today()
            return delta.days
        return None