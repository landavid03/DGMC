from marshmallow import Schema, fields, validate, validates, ValidationError
import datetime

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

    @validates('end_date')
    def validate_end_date(self, value):
        if 'start_date' in self.context and value < self.context['start_date']:
            raise ValidationError('End date must be after start date')

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
