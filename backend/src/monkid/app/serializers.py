from rest_framework import serializers
from .models import Student, Teacher
import logging

logger = logging.getLogger('monkid.app')

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'sequential_number', 'student_id']
        
    def create(self, validated_data):
        logger.debug(f"Creating student with data: {validated_data}")
        student = Student.objects.create(**validated_data)
        logger.debug(f"Student created with ID: {student.student_id}")
        return student
        
    def update(self, instance, validated_data):
        logger.debug(f"Updating student {instance.student_id} with data: {validated_data}")
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