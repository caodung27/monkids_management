import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Create Student table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_student (
        student_id integer NOT NULL PRIMARY KEY,
        name character varying(255) NULL,
        birthdate date NULL,
        classroom character varying(50) NULL,
        base_fee numeric(10,2) NOT NULL DEFAULT 0,
        discount_percentage double precision NOT NULL DEFAULT 0,
        final_fee numeric(10,2) NOT NULL DEFAULT 0,
        utilities_fee numeric(10,2) NOT NULL DEFAULT 0,
        pt numeric(10,2) NOT NULL DEFAULT 0,
        pm numeric(10,2) NOT NULL DEFAULT 0,
        meal_fee numeric(10,2) NOT NULL DEFAULT 0,
        eng_fee numeric(10,2) NOT NULL DEFAULT 0,
        skill_fee numeric(10,2) NOT NULL DEFAULT 0,
        total_fee numeric(10,2) NOT NULL DEFAULT 0,
        paid_amount numeric(10,2) NOT NULL DEFAULT 0,
        remaining_amount numeric(10,2) NOT NULL DEFAULT 0,
        created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        student_fund numeric(10,2) NOT NULL DEFAULT 0,
        facility_fee numeric(10,2) NOT NULL DEFAULT 0,
        sequential_number uuid NOT NULL DEFAULT gen_random_uuid()
    );
    """)
    
    # Create index on sequential_number field
    cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS app_student_sequential_number_idx 
    ON app_student (sequential_number);
    """)
    
    # Create Teacher table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_teacher (
        id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        role character varying(100) NOT NULL,
        phone character varying(20) NULL,
        base_salary numeric(10,2) NOT NULL DEFAULT 0,
        teaching_days integer NOT NULL DEFAULT 0,
        absence_days integer NOT NULL DEFAULT 0,
        received_salary numeric(10,2) NOT NULL DEFAULT 0,
        extra_teaching_days integer NOT NULL DEFAULT 0,
        extra_salary numeric(10,2) NOT NULL DEFAULT 0,
        insurance_support numeric(10,2) NOT NULL DEFAULT 0,
        responsibility_support numeric(10,2) NOT NULL DEFAULT 0,
        breakfast_support numeric(10,2) NOT NULL DEFAULT 0,
        skill_sessions integer NOT NULL DEFAULT 0,
        skill_salary numeric(10,2) NOT NULL DEFAULT 0,
        english_sessions integer NOT NULL DEFAULT 0,
        english_salary numeric(10,2) NOT NULL DEFAULT 0,
        new_students_list text NULL,
        paid_amount numeric(10,2) NOT NULL DEFAULT 0,
        total_salary numeric(10,2) NOT NULL DEFAULT 0,
        note text NULL,
        created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        name character varying(255) NOT NULL
    );
    """)
    
    print("Tables created successfully!") 