from marshmallow import Schema, fields, validate, validates, ValidationError
import datetime

class VehicleSchema(Schema):
    """Schema for Vehicle model"""
    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(required=True)
    make = fields.String(required=True, validate=validate.Length(min=1, max=50))
    model = fields.String(required=True, validate=validate.Length(min=1, max=50))
    year = fields.Integer(required=True)
    color = fields.String(required=True, validate=validate.Length(min=1, max=50))
    license_plate = fields.String(required=True, validate=validate.Length(min=1, max=20))
    vin = fields.String(validate=validate.Length(max=50))
    description = fields.String()
    notes = fields.String()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    image = fields.String()
    @validates('year')
    def validate_year(self, value):
        current_year = datetime.datetime.now().year
        if value < 1900 or value > current_year + 1:
            raise ValidationError(f'Year must be between 1900 and {current_year + 1}')

class VehicleUpdateSchema(Schema):
    """Schema for updating Vehicle model"""
    make = fields.String(validate=validate.Length(min=1, max=50))
    model = fields.String(validate=validate.Length(min=1, max=50))
    year = fields.Integer()
    color = fields.String(validate=validate.Length(min=1, max=50))
    license_plate = fields.String(validate=validate.Length(min=1, max=20))
    vin = fields.String(validate=validate.Length(max=50))
    description = fields.String()
    notes = fields.String()

    @validates('year')
    def validate_year(self, value):
        if value is not None:
            current_year = datetime.datetime.now().year
            if value < 1900 or value > current_year + 1:
                raise ValidationError(f'Year must be between 1900 and {current_year + 1}')


VehiclesSchema = VehicleSchema(many=True)
