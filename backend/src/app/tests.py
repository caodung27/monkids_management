from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from src.app.models import User, Student, Teacher
import uuid

class APITests(TestCase):
    """Test suite for the API endpoints"""

    def setUp(self):
        """Setup test data before each test case"""
        self.client = APIClient()
        
        # Create a test user (admin)
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='password123',
            is_admin=True,
            is_staff=True
        )
        
        # Create a test user (teacher)
        self.teacher_user = User.objects.create_user(
            email='teacher@test.com',
            password='password123',
            is_teacher=True
        )
        
        # Create a test user (normal)
        self.normal_user = User.objects.create_user(
            email='user@test.com',
            password='password123'
        )
        
        # Create a test student
        self.student = Student.objects.create(
            student_id=1,
            name='Test Student',
            classroom='Class A',
            base_fee=1000000,
            total_fee=1000000
        )
        
        # Create a test teacher
        self.teacher = Teacher.objects.create(
            id=uuid.uuid4(),
            name='Test Teacher',
            role='Head Teacher',
            base_salary=5000000,
            total_salary=5000000
        )
    
    def test_public_endpoints(self):
        """Test endpoints that should be accessible without authentication"""
        
        # Test Swagger UI
        response = self.client.get('/swagger/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test students list endpoint
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test specific student endpoint
        response = self.client.get(f'/api/students/{self.student.sequential_number}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test teachers list endpoint
        response = self.client.get('/api/teachers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test specific teacher endpoint
        response = self.client.get(f'/api/teachers/{self.teacher.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_authentication(self):
        """Test authentication endpoints"""
        
        # Test login with email/password
        response = self.client.post('/api/token/', {
            'email': 'admin@test.com',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)
        
        # Save tokens for later use
        self.admin_token = response.data['access']
        self.admin_refresh = response.data['refresh']
        
        # Test token refresh
        response = self.client.post('/api/token/refresh/', {
            'refresh': self.admin_refresh
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        
        # Test token verification
        response = self.client.post('/api/token/verify/', {
            'token': self.admin_token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test getting user permissions
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.get('/api/auth/permissions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('is_admin' in response.data)
        self.assertTrue(response.data['is_admin'])
        
    def test_student_operations(self):
        """Test CRUD operations on students"""
        
        # Login as admin
        response = self.client.post('/api/token/', {
            'email': 'admin@test.com',
            'password': 'password123'
        })
        self.admin_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        # Test creating a new student
        new_student_data = {
            'student_id': 2,
            'name': 'New Student',
            'classroom': 'Class B',
            'base_fee': 1200000,
            'total_fee': 1200000
        }
        response = self.client.post('/api/students/', new_student_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test updating a student
        update_data = {
            'name': 'Updated Student',
            'base_fee': 1500000,
            'total_fee': 1500000
        }
        response = self.client.patch(f'/api/students/{self.student.sequential_number}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Student')
        
        # Test getting student fees
        response = self.client.get(f'/api/students/{self.student.sequential_number}/fees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_teacher_operations(self):
        """Test CRUD operations on teachers"""
        
        # Login as admin
        response = self.client.post('/api/token/', {
            'email': 'admin@test.com',
            'password': 'password123'
        })
        self.admin_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        # Test creating a new teacher
        new_teacher_data = {
            'name': 'New Teacher',
            'role': 'Assistant',
            'base_salary': 4000000,
            'total_salary': 4000000
        }
        response = self.client.post('/api/teachers/', new_teacher_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test updating a teacher
        update_data = {
            'name': 'Updated Teacher',
            'base_salary': 4500000,
            'total_salary': 4500000
        }
        response = self.client.patch(f'/api/teachers/{self.teacher.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Teacher')
        
        # Test getting teacher salary
        response = self.client.get(f'/api/teachers/{self.teacher.id}/salary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_permission_enforcement(self):
        """Test that permissions are properly enforced"""
        
        # Login as normal user (not admin or teacher)
        response = self.client.post('/api/token/', {
            'email': 'user@test.com',
            'password': 'password123'
        })
        self.normal_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.normal_token}')
        
        # Try to create a student (should fail)
        new_student_data = {
            'student_id': 3,
            'name': 'Another Student',
            'classroom': 'Class C',
            'base_fee': 1100000,
            'total_fee': 1100000
        }
        response = self.client.post('/api/students/', new_student_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to create a teacher (should fail)
        new_teacher_data = {
            'name': 'Another Teacher',
            'role': 'Assistant',
            'base_salary': 3500000,
            'total_salary': 3500000
        }
        response = self.client.post('/api/teachers/', new_teacher_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Login as teacher user
        response = self.client.post('/api/token/', {
            'email': 'teacher@test.com',
            'password': 'password123'
        })
        self.teacher_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        
        # Teacher should be able to create a student
        new_student_data = {
            'student_id': 3,
            'name': 'Another Student',
            'classroom': 'Class C',
            'base_fee': 1100000,
            'total_fee': 1100000
        }
        response = self.client.post('/api/students/', new_student_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Teacher should not be able to create a teacher
        new_teacher_data = {
            'name': 'Another Teacher',
            'role': 'Assistant',
            'base_salary': 3500000,
            'total_salary': 3500000
        }
        response = self.client.post('/api/teachers/', new_teacher_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) 