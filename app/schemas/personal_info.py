from marshmallow import Schema, fields, validate, validates, ValidationError

class PersonalInfoSchema(Schema):
    """Schema for PersonalInfo model"""
    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(required=True)
    first_name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    age = fields.Integer(required=True, validate=validate.Range(min=18, max=120))
    blood_type = fields.String(validate=validate.OneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']))
    address = fields.String(validate=validate.Length(max=200))
    city = fields.String(validate=validate.Length(max=50))
    state = fields.String(validate=validate.Length(max=50))
    postal_code = fields.String(validate=validate.Length(max=20))
    country = fields.String(validate=validate.Length(max=50))
    latitude = fields.Float()
    longitude = fields.Float()
    allergies = fields.String()
    medical_notes = fields.String()
    phone_number = fields.String(validate=validate.Length(max=20))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('latitude')
    def validate_latitude(self, value):
        if value and (value < -90 or value > 90):
            raise ValidationError('Latitude must be between -90 and 90')

    @validates('longitude')
    def validate_longitude(self, value):
        if value and (value < -180 or value > 180):
            raise ValidationError('Longitude must be between -180 and 180')

class PersonalInfoUpdateSchema(Schema):
    """Schema for updating PersonalInfo model"""
    first_name = fields.String(validate=validate.Length(min=1, max=50))
    last_name = fields.String(validate=validate.Length(min=1, max=50))
    age = fields.Integer(validate=validate.Range(min=18, max=120))
    blood_type = fields.String(validate=validate.OneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']))
    address = fields.String(validate=validate.Length(max=200))
    city = fields.String(validate=validate.Length(max=50))
    state = fields.String(validate=validate.Length(max=50))
    postal_code = fields.String(validate=validate.Length(max=20))
    country = fields.String(validate=validate.Length(max=50))
    latitude = fields.Float()
    longitude = fields.Float()
    allergies = fields.String()
    medical_notes = fields.String()
    phone_number = fields.String(validate=validate.Length(max=20))

    @validates('latitude')
    def validate_latitude(self, value):
        if value and (value < -90 or value > 90):
            raise ValidationError('Latitude must be between -90 and 90')

    @validates('longitude')
    def validate_longitude(self, value):
        if value and (value < -180 or value > 180):
            raise ValidationError('Longitude must be between -180 and 180')

PersonalInfosSchema = PersonalInfoSchema(many=True)
