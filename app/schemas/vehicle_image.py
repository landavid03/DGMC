from marshmallow import Schema, fields, validate

class VehicleImageSchema(Schema):
    """Schema for VehicleImage model"""
    id = fields.Integer(dump_only=True)
    vehicle_id = fields.Integer(required=True)
    image_path = fields.String(required=True, validate=validate.Length(min=1, max=255))
    description = fields.String(validate=validate.Length(max=255))
    is_primary = fields.Boolean(default=False)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class VehicleImageUpdateSchema(Schema):
    """Schema for updating VehicleImage model"""
    description = fields.String(validate=validate.Length(max=255))
    is_primary = fields.Boolean()


VehiclesImageSchema = VehicleImageSchema(many=True)
