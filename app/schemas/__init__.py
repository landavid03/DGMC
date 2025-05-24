# Import all schemas to make them available when importing from schemas
from app.schemas.user import UserSchema, UserUpdateSchema, UserLoginSchema
from app.schemas.vehicle import VehicleSchema, VehicleUpdateSchema
from app.schemas.personal_info import PersonalInfoSchema, PersonalInfoUpdateSchema
from app.schemas.emergency_contact import EmergencyContactSchema, EmergencyContactUpdateSchema
from app.schemas.insurance_policy import InsurancePolicySchema, InsurancePolicyUpdateSchema
from app.schemas.vehicle_image import VehicleImageSchema, VehicleImageUpdateSchema
