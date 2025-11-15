from marshmallow import Schema, fields, validate, validates, ValidationError
import re

class UserSchema(Schema):
    """Schema for User model"""
    id = fields.Integer(dump_only=True)
    username = fields.String(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password_hash = fields.String(required=True, validate=validate.Length(min=3), load_only=True)
    role = fields.String(validate=validate.OneOf(['admin', 'monitor', 'user']), default='user')
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    is_active = fields.Boolean(dump_only=True)

    @validates('email')
    def validate_email(self, value):
        if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', value):
            raise ValidationError('Invalid email format')

class UserUpdateSchema(Schema):
    """Schema for updating User model"""
    username = fields.String(validate=validate.Length(min=3, max=50))
    email = fields.Email()
    password_hash = fields.String(validate=validate.Length(min=8), load_only=True)
    role = fields.String(validate=validate.OneOf(['admin', 'monitor', 'user']))

    @validates('email')
    def validate_email(self, value):
        if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', value):
            raise ValidationError('Invalid email format')

class UserLoginSchema(Schema):
    """Schema for user login"""
    username = fields.String(required=True)
    email = fields.String(required=False)
    password_hash = fields.String(required=True, load_only=True)

UsersSchema = UserSchema(many=True)

UserCreateSchema = UserSchema()
