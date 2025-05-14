from rest_framework import serializers
from .models import Student, Teacher
import logging

logger = logging.getLogger('src.app')

class StudentSerializer(serializers.ModelSerializer):
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
    class Meta:
        model = Teacher
        fields = '__all__'
        read_only_fields = ['id', 'created_at'] 