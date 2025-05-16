from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from src.app.models import Student

class SimpleTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a test student
        self.student = Student.objects.create(
            student_id=1,
            name='Test Student',
            classroom='Class A',
            base_fee=1000000,
            total_fee=1000000
        )
    
    def test_student_list_accessible(self):
        """Test that the student list endpoint is accessible"""
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK) 