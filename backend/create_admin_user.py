import os
import django
import sys
import uuid

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')
django.setup()

from django.db import connection
from django.contrib.auth.hashers import make_password
from datetime import datetime
import pytz

# Generate a UUID for the new admin user
user_id = uuid.uuid4()

# Current timestamp in UTC
now = datetime.now(pytz.UTC).isoformat()

# Admin user details
email = 'admin@example.com'
password = make_password('admin123')  # Hashed password
username = 'admin'

with connection.cursor() as cursor:
    # Check if user already exists
    cursor.execute("SELECT id FROM app_user WHERE email = %s", [email])
    existing_user = cursor.fetchone()
    
    if existing_user:
        print(f"Admin user with email {email} already exists.")
    else:
        # Create admin user
        cursor.execute("""
        INSERT INTO app_user (
            id, password, last_login, is_superuser, is_staff, is_active, 
            date_joined, username, email, first_name, last_name,
            google_id, profile_picture, is_teacher, is_admin
        ) VALUES (
            %s, %s, NULL, TRUE, TRUE, TRUE, 
            %s, %s, %s, 'Admin', 'User',
            NULL, NULL, FALSE, TRUE
        )
        """, [
            user_id, password, now, username, email
        ])
        
        print(f"Admin user created successfully with email: {email} and password: admin123")
        print(f"User ID: {user_id}") 