from marshmallow import Schema, fields, validate, validates, ValidationError
import datetime
from marshmallow import post_load

class InsurancePolicySchema(Schema):
    """Schema for InsurancePolicy model"""
    id = fields.Integer(dump_only=True)
    vehicle_id = fields.Integer(required=True)
    policy_number = fields.String(required=True, validate=validate.Length(min=1, max=50))
    company = fields.String(required=True, validate=validate.Length(min=1, max=100))
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    coverage_type = fields.String(validate=validate.Length(max=50))
    pdf_file_path = fields.String(validate=validate.Length(max=255))
    notes = fields.String()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    file_url = fields.String(allow_none=True, dump_only=True)
    file_path = fields.String(allow_none=True, dump_only=True)
    
    has_file = fields.Method("get_has_file", dump_only=True)
    is_expired = fields.Method("get_is_expired", dump_only=True)
    days_to_expire = fields.Method("get_days_to_expire", dump_only=True)
    
    def get_has_file(self, obj):
        """Verificar si tiene archivo asociado"""
        return obj.has_file
    
    def get_is_expired(self, obj):
        """Verificar si está vencida"""
        return obj.is_expired
    
    def get_days_to_expire(self, obj):
        """Días hasta vencimiento"""
        return obj.days_to_expire
    
    @post_load
    def make_policy(self, data, **kwargs):
        return InsurancePolicy(**data)
        
    @validates('end_date')
    def validate_end_date(self, value):
        if 'start_date' in self.context and value < self.context['start_date']:
            raise ValidationError('End date must be after start date')

class InsurancePolicysSchema(Schema):
    """Schema para lista de pólizas (múltiples)"""
    policies = fields.List(fields.Nested(InsurancePolicySchema))
    
    @classmethod
    def dump(cls, policies):
        """Método personalizado para serializar lista de pólizas"""
        schema = InsurancePolicySchema(many=True)
        return schema.dump(policies)


class InsurancePolicyUpdateSchema(Schema):
    """Schema for updating InsurancePolicy model"""
    policy_number = fields.String(validate=validate.Length(min=1, max=50))
    company = fields.String(validate=validate.Length(min=1, max=100))
    start_date = fields.Date()
    end_date = fields.Date()
    coverage_type = fields.String(validate=validate.Length(max=50))
    pdf_file_path = fields.String(validate=validate.Length(max=255))
    notes = fields.String()

    @validates('end_date')
    def validate_end_date(self, value):
        if 'start_date' in self.context and value < self.context['start_date']:
            raise ValidationError('End date must be after start date')

InsurancePolicysSchema = InsurancePolicySchema(many=True)
