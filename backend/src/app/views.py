from rest_framework import viewsets, filters, status
from .models import Student, Teacher
from .serializers import StudentSerializer, TeacherSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

logger = logging.getLogger('src.app')

class StudentViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing student information and fees.
    
    list:
        Returns a list of all students with their details
    retrieve:
        Returns a single student instance by sequential number
    create:
        Creates a new student with the provided data
    update:
        Updates an existing student with the provided data (full update)
    partial_update:
        Updates specified fields of an existing student (partial update)
    destroy:
        Deletes a student by sequential number
    """
    queryset = Student.objects.all().order_by('student_id')  # Default ordering
    serializer_class = StudentSerializer
    lookup_field = 'sequential_number'  # Use sequential_number instead of id
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['student_id', 'name', 'classroom', 'base_fee', 'total_fee']
    ordering = ['student_id']  # Default ordering

    def get_queryset(self):
        queryset = Student.objects.all()
        # Get the ordering parameter (default to student_id if not provided)
        ordering = self.request.query_params.get('ordering', 'student_id')
        # Apply ordering
        return queryset.order_by(ordering)
    
    @swagger_auto_schema(
        operation_description="Create a new student with complete fee information",
        responses={201: StudentSerializer}
    )    
    def create(self, request, *args, **kwargs):
        logger.debug(f"Creating student with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        student = self.perform_create(serializer)
        logger.debug(f"Student created: {student} - ID: {serializer.instance.student_id}")
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        try:
            instance = serializer.save()
            logger.debug(f"Student saved to database with ID: {instance.student_id}")
            return instance
        except Exception as e:
            logger.error(f"Error creating student: {str(e)}")
            raise e
    
    @swagger_auto_schema(
        operation_description="Update all fields of an existing student",
        responses={200: StudentSerializer}
    )     
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Process request data - make a copy to avoid modifying the original
        request_data = request.data.copy()
        
        # Remove immutable fields if present (these will be ignored by serializer anyway)
        if 'student_id' in request_data:
            del request_data['student_id']
        if 'sequential_number' in request_data:
            del request_data['sequential_number']
            
        logger.debug(f"Updating student {instance.student_id} with data: {request_data}")
        serializer = self.get_serializer(instance, data=request_data, partial=partial)
        
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def perform_update(self, serializer):
        try:
            instance = serializer.save()
            logger.debug(f"Student updated in database with ID: {instance.student_id}")
            return instance
        except Exception as e:
            logger.error(f"Error updating student: {str(e)}")
            raise e
    
    @swagger_auto_schema(
        operation_description="Update specific fields of an existing student",
        responses={200: StudentSerializer}
    )     
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Delete a student by sequential number",
        responses={204: "No content"}
    )     
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @swagger_auto_schema(
        operation_description="Get detailed fee information for a specific student",
        responses={200: openapi.Response(
            description="Fee details",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'student_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'name': openapi.Schema(type=openapi.TYPE_STRING),
                    'base_fee': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'discount_percentage': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'final_fee': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'total_fee': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'paid_amount': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'remaining_amount': openapi.Schema(type=openapi.TYPE_NUMBER),
                }
            )
        )}
    )
    @action(detail=True, methods=['get'])
    def fees(self, request, sequential_number=None):
        """Get detailed fee information for a specific student"""
        student = self.get_object()
        data = {
            'student_id': student.student_id,
            'name': student.name,
            'base_fee': student.base_fee,
            'discount_percentage': student.discount_percentage,
            'final_fee': student.final_fee,
            'total_fee': student.total_fee,
            'paid_amount': student.paid_amount,
            'remaining_amount': student.remaining_amount
        }
        return Response(data)

class TeacherViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing teacher information and salaries.
    
    list:
        Returns a list of all teachers with their details
    retrieve:
        Returns a single teacher instance by ID
    create:
        Creates a new teacher with the provided data
    update:
        Updates an existing teacher with the provided data (full update)
    partial_update:
        Updates specified fields of an existing teacher (partial update)
    destroy:
        Deletes a teacher by ID
    """
    queryset = Teacher.objects.all().order_by('name')  # Default ordering
    serializer_class = TeacherSerializer
    lookup_field = 'id'  # Use UUID as lookup field
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'role', 'base_salary', 'total_salary']
    ordering = ['name']  # Default ordering

    def get_queryset(self):
        queryset = Teacher.objects.all()
        # Get the ordering parameter (default to name if not provided)
        ordering = self.request.query_params.get('ordering', 'name')
        # Apply ordering
        print(f"Teacher count: {queryset.count()}")  # Debug info
        return queryset.order_by(ordering)
    
    @swagger_auto_schema(
        operation_description="Create a new teacher with complete salary information",
        responses={201: TeacherSerializer}
    )    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @swagger_auto_schema(
        operation_description="Update all fields of an existing teacher",
        responses={200: TeacherSerializer}
    )     
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Clean request data - remove id if present
        request_data = request.data.copy()
        if 'id' in request_data:
            del request_data['id']
            
        serializer = self.get_serializer(instance, data=request_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def perform_update(self, serializer):
        instance = serializer.save()
        print(f"Teacher updated in database with ID: {instance.id}")
        return instance
    
    @swagger_auto_schema(
        operation_description="Update specific fields of an existing teacher",
        responses={200: TeacherSerializer}
    )     
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Delete a teacher by ID",
        responses={204: "No content"}
    )     
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @swagger_auto_schema(
        operation_description="Get detailed salary information for a specific teacher",
        responses={200: openapi.Response(
            description="Salary details",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'name': openapi.Schema(type=openapi.TYPE_STRING),
                    'role': openapi.Schema(type=openapi.TYPE_STRING),
                    'base_salary': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'teaching_days': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'absence_days': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'extra_salary': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'total_salary': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'paid_amount': openapi.Schema(type=openapi.TYPE_NUMBER),
                }
            )
        )}
    )
    @action(detail=True, methods=['get'])
    def salary(self, request, id=None):
        """Get detailed salary information for a specific teacher"""
        teacher = self.get_object()
        data = {
            'name': teacher.name,
            'role': teacher.role,
            'base_salary': teacher.base_salary,
            'teaching_days': teacher.teaching_days,
            'absence_days': teacher.absence_days,
            'extra_salary': teacher.extra_salary,
            'total_salary': teacher.total_salary,
            'paid_amount': teacher.paid_amount
        }
        return Response(data) 