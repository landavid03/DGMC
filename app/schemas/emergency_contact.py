from marshmallow import Schema, fields, validate, validates, ValidationError
import re

class EmergencyContactSchema(Schema):
    """Schema for EmergencyContact model"""
    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    relationship = fields.String(required=True, validate=validate.Length(min=1, max=50))
    phone_number = fields.String(required=True, validate=validate.Length(min=7, max=20))
    alternative_phone = fields.String(validate=validate.Length(max=20))
    email = fields.Email()
    notes = fields.String()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('email')
    def validate_email(self, value):
        if value and not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', value):
            raise ValidationError('Invalid email format')

class EmergencyContactUpdateSchema(Schema):
    """Schema for updating EmergencyContact model"""
    name = fields.String(validate=validate.Length(min=1, max=100))
    relationship = fields.String(validate=validate.Length(min=1, max=50))
    phone_number = fields.String(validate=validate.Length(min=7, max=20))
    alternative_phone = fields.String(validate=validate.Length(max=20))
    email = fields.Email()
    notes = fields.String()

    @validates('email')
    def validate_email(self, value):
        if value and not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', value):
            raise ValidationError('Invalid email format')

EmergencyContactsSchema = EmergencyContactSchema(many=True)
