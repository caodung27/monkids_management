from rest_framework import viewsets, filters, status, permissions
from .models import Student, Teacher, User
from .serializers import (
    StudentSerializer, TeacherSerializer, 
    UserSerializer, UserRegisterSerializer, GoogleAuthSerializer,
    CustomTokenRefreshSerializer
)
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from social_django.utils import psa
from django.http import HttpResponseRedirect
import datetime
import urllib.parse

logger = logging.getLogger('src.app')
User = get_user_model()

# Thêm log handler đặc biệt cho OAuth
oauth_logger = logging.getLogger('social_core')
oauth_logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
oauth_logger.addHandler(handler)

# Swagger request and response schemas
user_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_STRING, format='uuid'),
        'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
        'profile_picture': openapi.Schema(type=openapi.TYPE_STRING, format='uri'),
        'is_teacher': openapi.Schema(type=openapi.TYPE_BOOLEAN),
        'is_admin': openapi.Schema(type=openapi.TYPE_BOOLEAN),
    }
)

token_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'refresh': openapi.Schema(type=openapi.TYPE_STRING),
        'access': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

google_login_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['token'],
    properties={
        'token': openapi.Schema(type=openapi.TYPE_STRING, description='Google ID token'),
    }
)

register_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['email', 'password', 'password_confirm'],
    properties={
        'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),
        'password': openapi.Schema(type=openapi.TYPE_STRING, format='password'),
        'password_confirm': openapi.Schema(type=openapi.TYPE_STRING, format='password'),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow teachers or admins.
    """
    def has_permission(self, request, view):
        # First check if the user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Then check if they have the required roles
        return (request.user.is_teacher or request.user.is_admin or request.user.is_superuser)

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit but anyone to view.
    """
    def has_permission(self, request, view):
        logger.debug(f"IsAdminOrReadOnly: Checking permission for method {request.method}")
        logger.debug(f"IsAdminOrReadOnly: Headers: {dict(request.headers)}")
        logger.debug(f"IsAdminOrReadOnly: User: {request.user}, Authenticated: {request.user.is_authenticated if request.user else 'No user'}")

        # Allow anyone to read
        if request.method in permissions.SAFE_METHODS:
            logger.debug("IsAdminOrReadOnly: SAFE_METHOD, permission granted.")
            return True
        
        # For write operations, check authentication and admin status
        if not request.user or not request.user.is_authenticated:
            logger.warning("IsAdminOrReadOnly: Write operation, user not authenticated. Permission denied.")
            return False
            
        is_admin_or_superuser = (request.user.is_admin or request.user.is_superuser)
        logger.debug(f"IsAdminOrReadOnly: Write operation, user authenticated. Is admin/superuser: {is_admin_or_superuser}")
        if not is_admin_or_superuser:
            logger.warning(f"IsAdminOrReadOnly: User {request.user.email if hasattr(request.user, 'email') else request.user} is not admin/superuser. Permission denied.")
        return is_admin_or_superuser

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
    bulk_delete:
        Deletes multiple students by sequential numbers
    """
    queryset = Student.objects.all().order_by('student_id')  # Default ordering
    serializer_class = StudentSerializer
    lookup_field = 'sequential_number'  # Use sequential_number instead of id
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['student_id', 'name', 'classroom', 'base_fee', 'total_fee']
    ordering = ['student_id']  # Default ordering
    
    def get_permissions(self):
        """
        Override to allow different permissions based on the action:
        - Allow unauthenticated access to list and retrieve actions
        - Require IsTeacherOrAdmin for other actions
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsTeacherOrAdmin]
        return [permission() for permission in permission_classes]

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

    @swagger_auto_schema(
        operation_description="Delete multiple students by sequential numbers",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['ids'],
            properties={
                'ids': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_STRING),
                    description='List of student sequential numbers to delete'
                )
            }
        ),
        responses={
            200: openapi.Response(
                description="Students deleted successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'deleted': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            400: "Bad request - Invalid data",
            404: "Not found - One or more students not found"
        }
    )
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Delete multiple students at once by sequential numbers"""
        ids = request.data.get('ids', [])
        
        if not ids:
            return Response(
                {"error": "No student IDs provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Validate that all IDs exist
        queryset = self.get_queryset()
        to_delete = queryset.filter(sequential_number__in=ids)
        
        # Check if we found all students
        if to_delete.count() != len(ids):
            # Find which IDs were not found
            found_ids = [str(obj.sequential_number) for obj in to_delete]
            not_found = [id for id in ids if id not in found_ids]
            
            return Response(
                {
                    "error": f"Some students were not found: {', '.join(not_found)}",
                    "not_found": not_found
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete the students
        deleted_count = to_delete.count()
        to_delete.delete()
        
        return Response(
            {
                "deleted": deleted_count,
                "message": f"Successfully deleted {deleted_count} students"
            },
            status=status.HTTP_200_OK
        )

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
    bulk_delete:
        Deletes multiple teachers by IDs
    """
    queryset = Teacher.objects.all().order_by('name')  # Default ordering
    serializer_class = TeacherSerializer
    lookup_field = 'id'  # Use UUID as lookup field
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'role', 'base_salary', 'total_salary']
    ordering = ['name']  # Default ordering
    
    def get_permissions(self):
        """
        Override to allow different permissions based on the action:
        - Allow unauthenticated access to list and retrieve actions
        - Require IsAdminOrReadOnly for other actions
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminOrReadOnly]
        return [permission() for permission in permission_classes]

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

    @swagger_auto_schema(
        operation_description="Delete multiple teachers by IDs",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['ids'],
            properties={
                'ids': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_STRING),
                    description='List of teacher IDs to delete'
                )
            }
        ),
        responses={
            200: openapi.Response(
                description="Teachers deleted successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'deleted': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            400: "Bad request - Invalid data",
            404: "Not found - One or more teachers not found"
        }
    )
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Delete multiple teachers at once by IDs"""
        ids = request.data.get('ids', [])
        
        if not ids:
            return Response(
                {"error": "No teacher IDs provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Validate that all IDs exist
        queryset = self.get_queryset()
        to_delete = queryset.filter(id__in=ids)
        
        # Check if we found all teachers
        if to_delete.count() != len(ids):
            # Find which IDs were not found
            found_ids = [str(obj.id) for obj in to_delete]
            not_found = [id for id in ids if id not in found_ids]
            
            return Response(
                {
                    "error": f"Some teachers were not found: {', '.join(not_found)}",
                    "not_found": not_found
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete the teachers
        deleted_count = to_delete.count()
        to_delete.delete()
        
        return Response(
            {
                "deleted": deleted_count,
                "message": f"Successfully deleted {deleted_count} teachers"
            },
            status=status.HTTP_200_OK
        )

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing user accounts.
    
    list:
        Returns a list of all users (admin only)
    retrieve:
        Returns a single user instance by ID (own user or admin only)
    create:
        Creates a new user account
    update:
        Updates an existing user (admin only)
    partial_update:
        Updates specified fields of an existing user (admin only)
    destroy:
        Deletes a user by ID (admin only)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create' or self.action == 'register':
            permission_classes = [AllowAny]
        elif self.action == 'retrieve' and self.request.user.is_authenticated:
            # Users can view their own profile
            permission_classes = [IsAuthenticated]
        else:
            # Admin required for other user operations
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    @swagger_auto_schema(
        operation_description="Register a new user account",
        request_body=register_request_schema,
        responses={
            201: openapi.Response(
                description="User registered successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'user': user_response_schema,
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                        'access': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            400: "Bad request - validation error"
        }
    )
    @action(detail=False, methods=['post'], serializer_class=UserRegisterSerializer)
    def register(self, request):
        """Register a new user and return authentication tokens"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        response_data = {
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @swagger_auto_schema(
        operation_description="Get the current user's profile",
        responses={
            200: openapi.Response(
                description="User profile retrieved successfully",
                schema=user_response_schema
            ),
            401: "Authentication credentials not provided"
        }
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get the current user's profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class LogoutView(APIView):
    """
    API endpoint for logging out users by blacklisting their refresh token.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Logout by blacklisting the refresh token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['refresh'],
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='JWT refresh token to blacklist')
            }
        ),
        responses={
            205: "Refresh token blacklisted, user logged out successfully",
            400: "Bad request or invalid token",
            401: "Authentication credentials not provided"
        }
    )
    def post(self, request):
        """
        Logout the user by blacklisting their refresh token
        """
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Create response that clears the auth cookies
            response = Response({"detail": "Successfully logged out"}, status=status.HTTP_205_RESET_CONTENT)
            
            # Determine secure settings based on protocol for cookie deletion
            is_secure = request.is_secure()
            
            # Clear cookies by setting them with immediate expiry
            response.delete_cookie(
                'accessToken',
                path='/',
                samesite='None' if is_secure else 'Lax',
                secure=is_secure
            )
            
            response.delete_cookie(
                'refreshToken',
                path='/',
                samesite='None' if is_secure else 'Lax',
                secure=is_secure
            )
            
            # Also clear other auth-related cookies
            response.delete_cookie(
                'auth_redirect',
                path='/',
                samesite='None' if is_secure else 'Lax',
                secure=is_secure
            )
            
            response.delete_cookie(
                'auth_timestamp',
                path='/',
                samesite='None' if is_secure else 'Lax',
                secure=is_secure
            )
            
            logger.debug(f"User logged out: {request.user.email if hasattr(request.user, 'email') else 'Unknown user'}")
            
            return response
        except TokenError:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class UserPermissionsView(APIView):
    """
    API endpoint for retrieving the current user's permissions and roles.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get current user permissions and roles",
        responses={
            200: openapi.Response(
                description="User permissions retrieved successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'is_authenticated': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'is_staff': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'is_superuser': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'is_teacher': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'is_admin': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'email': openapi.Schema(type=openapi.TYPE_STRING),
                        'id': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            401: "Authentication credentials not provided"
        }
    )
    def get(self, request):
        """
        Returns the permissions and roles for the current user
        """
        user = request.user
        
        permissions_data = {
            'is_authenticated': user.is_authenticated,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_teacher': user.is_teacher,
            'is_admin': user.is_admin,
            'email': user.email,
            'id': user.id,
        }
        
        return Response(permissions_data)

class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that uses our custom serializer.
    
    Takes a refresh token and returns a new access token.
    """
    serializer_class = CustomTokenRefreshSerializer
    
    @swagger_auto_schema(
        operation_description="Refresh access token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['refresh'],
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='JWT refresh token')
            }
        ),
        responses={
            200: openapi.Response(
                description="Token refresh successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            401: "Invalid refresh token"
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class SessionToTokenView(APIView):
    """
    Exchanges a Django session (from social_django) for API tokens.
    This view should be called by the frontend after a successful server-side OAuth2 login.
    """
    permission_classes = [] # Remove IsAuthenticated to allow anonymous access

    @swagger_auto_schema(
        operation_description="Exchange Django session for JWT tokens after social login.",
        responses={
            200: openapi.Response(
                description="Tokens generated successfully.",
                schema=token_response_schema # Use the existing token_response_schema
            ),
            401: "User not authenticated (no valid session).",
            403: "User account is disabled."
        }
    )
    def get(self, request):
        # Log all request information to help debug
        logger.info(f"SessionToTokenView: Request received - Method: {request.method}")
        logger.debug(f"SessionToTokenView: Headers: {dict(request.headers.items())}")
        logger.debug(f"SessionToTokenView: Cookies: {request.COOKIES}")
        logger.debug(f"SessionToTokenView: User authenticated: {request.user.is_authenticated}")
        logger.debug(f"SessionToTokenView: Session keys: {list(request.session.keys()) if hasattr(request, 'session') else 'No session'}")
        
        # Check if the user is authenticated through session
        if request.user.is_authenticated:
            logger.info(f"SessionToTokenView: User authenticated via Django session: {request.user.email}")
            
            if not request.user.is_active:
                logger.warning(f"SessionToTokenView: User account is disabled: {request.user.email}")
                return Response({"detail": "User account is disabled."}, status=status.HTTP_403_FORBIDDEN)

            # Generate tokens for the authenticated user
            refresh = RefreshToken.for_user(request.user)
            
            # Log token generation
            token_data = {
                'refresh': str(refresh)[:10] + "...",
                'access': str(refresh.access_token)[:10] + "...",
                'user_id': str(request.user.id)
            }
            logger.info(f"SessionToTokenView: Generated tokens for user: {token_data}")
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(request.user).data # Optionally return user details
            }, status=status.HTTP_200_OK)
        
        # Check if we have user email in headers - particularly for debugging API issues
        auth_email = request.headers.get('X-Auth-Email')
        logger.debug(f"SessionToTokenView: X-Auth-Email header: {auth_email}")
        
        # For auth_email from an Authorization header of type Basic
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Basic '):
            import base64
            try:
                logger.debug(f"SessionToTokenView: Found Basic auth header")
                auth_decoded = base64.b64decode(auth_header[6:]).decode('utf-8')
                if ':' in auth_decoded:
                    username, _ = auth_decoded.split(':', 1)
                    auth_email = username
                    logger.debug(f"SessionToTokenView: Extracted email from Basic auth: {auth_email}")
            except Exception as e:
                logger.error(f"SessionToTokenView: Error decoding Basic auth: {str(e)}")
        
        # Check for user ID in query params for debugging
        user_id_param = request.GET.get('user_id')
        email_param = request.GET.get('email')
        
        logger.debug(f"SessionToTokenView: Query params - user_id: {user_id_param}, email: {email_param}")
        
        # Check if we have a user email in cookie that we can use
        user_info_cookie = request.COOKIES.get('user_info')
        if user_info_cookie:
            try:
                # Try to parse the user info cookie
                import urllib.parse
                decoded = urllib.parse.unquote(user_info_cookie)
                parts = decoded.split(':')
                
                if len(parts) >= 2:
                    user_id, email = parts[0], parts[1]
                    logger.info(f"SessionToTokenView: Found user info cookie - ID: {user_id}, Email: {email}")
                    
                    # Try to find the user
                    try:
                        user = User.objects.get(id=user_id, email=email)
                        logger.info(f"SessionToTokenView: User found from cookie: {user.email}")
                        
                        # Generate tokens
                        refresh = RefreshToken.for_user(user)
                        return Response({
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                            'user': UserSerializer(user).data
                        }, status=status.HTTP_200_OK)
                    except User.DoesNotExist:
                        logger.warning(f"SessionToTokenView: User not found for cookie data - ID: {user_id}, Email: {email}")
            except Exception as e:
                logger.error(f"SessionToTokenView: Error parsing user info cookie: {str(e)}")
        
        # Fallback - check if we have JWT in cookies that we can validate
        access_token_cookie = request.COOKIES.get('accessToken')
        if access_token_cookie:
            logger.info("SessionToTokenView: Found access token cookie, attempting to validate")
            try:
                # Try to decode the token
                from rest_framework_simplejwt.tokens import AccessToken
                decoded_token = AccessToken(access_token_cookie)
                
                # Get user from token
                user_id = decoded_token.get('user_id')
                if user_id:
                    try:
                        user = User.objects.get(id=user_id)
                        logger.info(f"SessionToTokenView: User found from token: {user.email}")
                        
                        # Generate new tokens
                        refresh = RefreshToken.for_user(user)
                        return Response({
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                            'user': UserSerializer(user).data
                        }, status=status.HTTP_200_OK)
                    except User.DoesNotExist:
                        logger.warning(f"SessionToTokenView: User not found for token user_id: {user_id}")
            except Exception as e:
                logger.error(f"SessionToTokenView: Error validating access token cookie: {str(e)}")
        
        # Try to find user from query params or auth header
        if auth_email or email_param or user_id_param:
            try:
                user = None
                if user_id_param:
                    try:
                        user = User.objects.get(id=user_id_param)
                        logger.info(f"SessionToTokenView: User found from user_id param: {user.email}")
                    except User.DoesNotExist:
                        logger.warning(f"SessionToTokenView: User not found for user_id param: {user_id_param}")
                
                if not user and (auth_email or email_param):
                    email_to_use = auth_email or email_param
                    try:
                        user = User.objects.get(email=email_to_use)
                        logger.info(f"SessionToTokenView: User found from email: {user.email}")
                    except User.DoesNotExist:
                        logger.warning(f"SessionToTokenView: User not found for email: {email_to_use}")
                
                if user:
                    # Generate tokens
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user': UserSerializer(user).data
                    }, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"SessionToTokenView: Error finding user from params: {str(e)}")
        
        # DEVELOPMENT ONLY - EMERGENCY FALLBACK FOR DEBUGGING
        # Check if we're in development mode
        if settings.DEBUG:
            logger.warning("SessionToTokenView: USING DEVELOPMENT EMERGENCY FALLBACK - creating/using admin user for auth!")
            
            # Try to get or create a superuser for development
            try:
                admin_email = 'admin@example.com'
                admin_user, created = User.objects.get_or_create(
                    email=admin_email,
                    defaults={
                        'is_active': True,
                        'is_staff': True,
                        'is_superuser': True,
                        'is_admin': True,
                        'first_name': 'Admin',
                        'last_name': 'User'
                    }
                )
                
                if created:
                    admin_user.set_password('admin123')  # Only for development!
                    admin_user.save()
                    logger.warning(f"SessionToTokenView: Created emergency admin user: {admin_email}")
                else:
                    logger.warning(f"SessionToTokenView: Using existing admin user: {admin_email}")
                
                # Generate tokens for the admin user
                refresh = RefreshToken.for_user(admin_user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(admin_user).data,
                    'warning': 'DEVELOPMENT EMERGENCY AUTH - Using admin account'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"SessionToTokenView: Error with emergency admin fallback: {str(e)}")
        
        # If we reach here, authentication failed
        logger.error("SessionToTokenView: No valid authentication method found")
        auth_methods_tried = {
            "django_session": request.user.is_authenticated,
            "user_info_cookie": bool(user_info_cookie),
            "access_token_cookie": bool(access_token_cookie),
            "auth_header": bool(auth_header),
            "query_params": bool(user_id_param or email_param),
            "debug_mode": settings.DEBUG
        }
        return Response({
            "detail": "User not authenticated via session or cookies.",
            "auth_methods_tried": auth_methods_tried,
            "debug_info": {
                "has_session": hasattr(request, 'session'),
                "user_authenticated": getattr(request.user, 'is_authenticated', False),
                "cookies_available": list(request.COOKIES.keys()) if hasattr(request, 'COOKIES') else []
            }
        }, status=status.HTTP_401_UNAUTHORIZED)

# Add a direct auth endpoint for development
class DirectAuthView(APIView):
    """
    Development-only endpoint to get tokens directly.
    WARNING: This should NEVER be used in production!
    """
    permission_classes = []
    
    @swagger_auto_schema(
        operation_description="Get tokens directly (development only).",
        responses={
            200: openapi.Response(
                description="Tokens generated successfully.",
                schema=token_response_schema
            ),
            404: "User not found.",
            403: "Not allowed in production."
        }
    )
    def get(self, request):
        if not settings.DEBUG:
            return Response({
                "detail": "This endpoint is only available in development mode."
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get email from query param
        email = request.GET.get('email', 'admin@example.com')
        
        try:
            # Try to get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'is_active': True,
                    'is_staff': True if email == 'admin@example.com' else False,
                    'is_superuser': True if email == 'admin@example.com' else False,
                    'is_admin': True if email == 'admin@example.com' else False,
                    'first_name': 'Dev',
                    'last_name': 'User'
                }
            )
            
            if created:
                user.set_password('dev123')  # Only for development!
                user.save()
                logger.warning(f"DirectAuthView: Created dev user: {email}")
            else:
                logger.warning(f"DirectAuthView: Using existing user: {email}")
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Set cookies
            response = Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
                'warning': 'DEVELOPMENT DIRECT AUTH - Not for production use'
            }, status=status.HTTP_200_OK)
            
            # Add cookies to help with frontend auth
            response.set_cookie(
                'accessToken', 
                str(refresh.access_token),
                max_age=3600,
                path='/',
                httponly=False,
                samesite='Lax'
            )
            
            response.set_cookie(
                'refreshToken', 
                str(refresh),
                max_age=86400,
                path='/',
                httponly=False,
                samesite='Lax'
            )
            
            # Set user info cookie
            import urllib.parse
            response.set_cookie(
                'user_info', 
                urllib.parse.quote(f"{user.id}:{user.email}:{datetime.datetime.now().timestamp()}"),
                max_age=86400,
                path='/',
                httponly=False,
                samesite='Lax'
            )
            
            return response
        except Exception as e:
            logger.error(f"DirectAuthView: Error: {str(e)}")
            return Response({
                "detail": f"Error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add OAuth success handler
def complete_google_oauth(request, *args, **kwargs):
    """
    Handle Google OAuth completion and return user data with tokens
    instead of redirecting.
    This function will be called by social-auth-app-django's complete view.
    """
    oauth_logger.debug("complete_google_oauth called with user: %s", kwargs.get('user'))
    user = kwargs.get('user')
    
    # If no user was authenticated yet, return error
    if not user or not user.is_authenticated:
        error_url = f"http://localhost:3000/login?error=Authentication+failed"
        oauth_logger.error("OAuth completion error: No authenticated user")
        return HttpResponseRedirect(error_url)
        
    try:
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Ensure tokens are properly formatted
        access_token = access_token.strip()
        refresh_token = refresh_token.strip()
        
        # Log token details for debugging (only first few chars)
        oauth_logger.debug(f"Generated tokens for user {user.email} - Access: {access_token[:15]}... Refresh: {refresh_token[:15]}...")
        
        # Create a timestamp to prevent caching issues
        timestamp = int(datetime.datetime.now().timestamp() * 1000)
        
        # Create token params for URL - use URL-safe encoding
        token_params = (
            f"access_token={urllib.parse.quote(access_token)}&"
            f"refresh_token={urllib.parse.quote(refresh_token)}&"
            f"user_id={user.id}&"
            f"email={urllib.parse.quote(user.email)}&"
            f"timestamp={timestamp}"
        )
        
        # Add debug params to help diagnose any issues
        token_params += f"&token_preview={access_token[:10]}"
        
        # Always use the auth/callback route - this is the only one we need
        success_url = f"http://localhost:3000/auth/callback?{token_params}"
        oauth_logger.debug(f"Redirecting to: {success_url[:60]}...")
        
        # Determine secure settings based on request protocol
        is_secure = request.is_secure()
        
        # Create response with redirect
        response = HttpResponseRedirect(success_url)
        
        # Set cookies with appropriate security settings - use HttpOnly=False to allow JS access
        response.set_cookie(
            'accessToken', 
            access_token, 
            max_age=60*60*24,  # 1 day
            path='/',
            httponly=False,  # Allow JS access
            samesite='Lax',  # Works better across browsers
            secure=is_secure  # Set secure flag based on protocol
        )
        
        response.set_cookie(
            'refreshToken', 
            refresh_token, 
            max_age=60*60*24*7,  # 7 days
            path='/',
            httponly=False,  # Allow JS access
            samesite='Lax',
            secure=is_secure
        )
        
        # Add flags to indicate successful login
        response.set_cookie(
            'auth_successful', 
            'true', 
            max_age=60*60*24,  # 1 day
            path='/',
            httponly=False,
            samesite='Lax',
            secure=is_secure
        )
        
        # Add timestamp to prevent stale cache issues
        response.set_cookie(
            'auth_timestamp', 
            str(timestamp), 
            max_age=60*60*24,  # 1 day
            path='/',
            httponly=False,
            samesite='Lax',
            secure=is_secure
        )
        
        # Add additional JWT-specific cookies to help troubleshoot
        response.set_cookie(
            'jwt_token_set', 
            'true', 
            max_age=60*60*24,  # 1 day
            path='/',
            httponly=False,
            samesite='Lax',
            secure=is_secure
        )
        
        # Also store session info in a JWT-friendly way
        response.set_cookie(
            'user_info', 
            urllib.parse.quote(f"{user.id}:{user.email}:{timestamp}"), 
            max_age=60*60*24,  # 1 day
            path='/',
            httponly=False,
            samesite='Lax',
            secure=is_secure
        )
        
        return response
    except Exception as e:
        oauth_logger.error(f"OAuth completion error: {str(e)}")
        error_url = f"http://localhost:3000/login?error={urllib.parse.quote(str(e))}"
        return HttpResponseRedirect(error_url)

class TokenIntrospectView(APIView):
    """
    API endpoint for introspecting the validity of an access token.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Introspect token validity",
        responses={
            200: openapi.Response(
                description="Token is valid",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'active': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'exp': openapi.Schema(type=openapi.TYPE_INTEGER, description='Expiration timestamp'),
                        'user_id': openapi.Schema(type=openapi.TYPE_STRING, description='User ID'),
                    }
                )
            ),
            401: "Invalid or expired token"
        }
    )
    def get(self, request):
        """
        Check if the token is valid and return its expiration time.
        """
        # If we reach here, the token is valid (due to IsAuthenticated permission)
        # Get the token from the authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return Response(
                {"active": False, "error": "Invalid authorization header format"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Extract the token
        token = auth_header.split(' ')[1].strip()
        
        try:
            # Decode the token
            from rest_framework_simplejwt.tokens import AccessToken
            decoded_token = AccessToken(token)
            
            # Get token data
            user_id = decoded_token.get('user_id')
            exp = decoded_token.get('exp')
            
            return Response({
                "active": True,
                "exp": exp,
                "user_id": user_id,
                "token_type": "access"
            })
            
        except Exception as e:
            # Log the error
            logger.error(f"Token introspection error: {str(e)}")
            
            # Return detailed error for debugging
            return Response({
                "active": False,
                "error": f"Token validation failed: {str(e)}",
                "token_preview": token[:10] + "..." if token else None
            }, status=status.HTTP_401_UNAUTHORIZED) 