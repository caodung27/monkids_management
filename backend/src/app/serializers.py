from rest_framework import serializers
from .models import Student, Teacher, User
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

logger = logging.getLogger('src.app')

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User objects
    
    Used for retrieving and updating user information.
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_picture', 'is_teacher', 'is_admin']
        read_only_fields = ['id']

class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    
    Takes email, password, password confirmation and names to create a new user.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class GoogleAuthSerializer(serializers.Serializer):
    """
    Serializer for Google OAuth2 authentication
    
    Takes a Google ID token and validates it with Google's servers.
    """
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                value, 
                requests.Request(), 
                self.context['client_id']
            )
            
            # Check issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise serializers.ValidationError("Wrong issuer.")
            
            return idinfo
        except Exception as e:
            raise serializers.ValidationError(f"Invalid token: {str(e)}")
    
    def get_tokens_for_user(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for Student objects
    
    Used for CRUD operations on student data.
    """
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'sequential_number']
        extra_kwargs = {
            'student_id': {'required': False}  # Make student_id optional in validation
        }
        
    def create(self, validated_data):
        logger.debug(f"Creating student with data: {validated_data}")
        
        # Auto-generate student_id if not provided
        if 'student_id' not in validated_data:
            # Get the highest student_id and increment by 1
            max_id = Student.objects.all().order_by('-student_id').first()
            next_id = 1
            if max_id:
                next_id = max_id.student_id + 1
            
            validated_data['student_id'] = next_id
            logger.debug(f"Auto-generated student_id: {next_id}")
        
        student = Student.objects.create(**validated_data)
        logger.debug(f"Student created with ID: {student.student_id}")
        return student
        
    def update(self, instance, validated_data):
        logger.debug(f"Updating student {instance.student_id} with data: {validated_data}")
        # Ensure student_id cannot be changed during update
        validated_data.pop('student_id', None)
        validated_data.pop('sequential_number', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        logger.debug(f"Student {instance.student_id} updated successfully")
        return instance

class TeacherSerializer(serializers.ModelSerializer):
    """
    Serializer for Teacher objects
    
    Used for CRUD operations on teacher data.
    """
    class Meta:
        model = Teacher
        fields = ['id', 'role', 'phone', 'base_salary', 'teaching_days', 'absence_days', 
                 'received_salary', 'extra_teaching_days', 'extra_salary', 'insurance_support', 
                 'responsibility_support', 'breakfast_support', 'skill_sessions', 'skill_salary', 
                 'english_sessions', 'english_salary', 'new_students_list', 'paid_amount', 
                 'total_salary', 'note', 'created_at', 'name']
        read_only_fields = ['id']

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Custom token refresh serializer
    
    Extends the standard JWT token refresh serializer for additional validation.
    """
    def validate(self, attrs):
        try:
            # Add extra logging for debugging token issues
            logger.debug(f"Token refresh attempt with token: {attrs['refresh'][:10]}...")
            
            # Clean the refresh token by trimming whitespace
            if 'refresh' in attrs and attrs['refresh']:
                attrs['refresh'] = attrs['refresh'].strip()
            
            # Call the parent validate method
            data = super().validate(attrs)
            
            # Add extra validation if needed
            # For example, logging the successful refresh
            logger.debug(f"Token refresh successful, new access token: {data['access'][:10]}...")
            
            return data
        except Exception as e:
            # Log the error for easier debugging
            logger.error(f"Token refresh failed: {str(e)}")
            # Re-raise the exception to maintain API behavior
            raise 