import os
import django
import csv
from datetime import datetime
import uuid
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')
django.setup()

from src.app.models import Student, Teacher

def import_students(csv_path):
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Convert empty strings to None
            for key, value in row.items():
                if value == '':
                    row[key] = None
            
            # Parse dates
            if row['birthdate']:
                try:
                    row['birthdate'] = datetime.strptime(row['birthdate'], '%Y-%m-%d').date()
                except ValueError:
                    row['birthdate'] = None
            
            # Convert numeric fields
            numeric_fields = [
                'base_fee', 'discount_percentage', 'final_fee', 'utilities_fee', 
                'pt', 'pm', 'meal_fee', 'eng_fee', 'skill_fee', 'total_fee', 
                'paid_amount', 'remaining_amount', 'student_fund', 'facility_fee'
            ]
            for field in numeric_fields:
                if row[field] is not None:
                    row[field] = float(row[field])
            
            # Parse datetime fields
            for datetime_field in ['created_at', 'updated_at']:
                if row[datetime_field]:
                    row[datetime_field] = datetime.strptime(row[datetime_field], '%Y-%m-%d %H:%M:%S.%f %z')
            
            # Create or update student
            student, created = Student.objects.update_or_create(
                student_id=int(row['student_id']),
                defaults={
                    'name': row['name'],
                    'birthdate': row['birthdate'],
                    'classroom': row['classroom'],
                    'base_fee': row['base_fee'],
                    'discount_percentage': row['discount_percentage'],
                    'final_fee': row['final_fee'],
                    'utilities_fee': row['utilities_fee'],
                    'pt': row['pt'],
                    'pm': row['pm'],
                    'meal_fee': row['meal_fee'],
                    'eng_fee': row['eng_fee'],
                    'skill_fee': row['skill_fee'],
                    'total_fee': row['total_fee'],
                    'paid_amount': row['paid_amount'],
                    'remaining_amount': row['remaining_amount'],
                    'student_fund': row['student_fund'],
                    'facility_fee': row['facility_fee'],
                    'sequential_number': uuid.UUID(row['sequential_number'])
                }
            )
            print(f"{'Created' if created else 'Updated'} student: {student}")

def import_teachers(csv_path):
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Convert empty strings to None
            for key, value in row.items():
                if value == '':
                    row[key] = None
            
            # Convert numeric fields
            numeric_fields = [
                'base_salary', 'teaching_days', 'absence_days', 'received_salary', 
                'extra_teaching_days', 'extra_salary', 'insurance_support', 
                'responsibility_support', 'breakfast_support', 'skill_sessions', 
                'skill_salary', 'english_sessions', 'english_salary', 
                'paid_amount', 'total_salary'
            ]
            for field in numeric_fields:
                if row[field] is not None:
                    row[field] = float(row[field])
            
            # Parse datetime fields
            if row['created_at']:
                try:
                    row['created_at'] = datetime.strptime(row['created_at'], '%Y-%m-%d %H:%M:%S.%f %z')
                except ValueError:
                    try:
                        row['created_at'] = datetime.strptime(row['created_at'], '%Y-%m-%d %H:%M:%S.%f')
                    except ValueError:
                        row['created_at'] = datetime.now()
            
            # Create or update teacher
            teacher, created = Teacher.objects.update_or_create(
                id=uuid.UUID(row['id']),
                defaults={
                    'role': row['role'],
                    'phone': row['phone'],
                    'base_salary': row['base_salary'],
                    'teaching_days': int(row['teaching_days']) if row['teaching_days'] is not None else 0,
                    'absence_days': int(row['absence_days']) if row['absence_days'] is not None else 0,
                    'received_salary': row['received_salary'],
                    'extra_teaching_days': int(row['extra_teaching_days']) if row['extra_teaching_days'] is not None else 0,
                    'extra_salary': row['extra_salary'],
                    'insurance_support': row['insurance_support'],
                    'responsibility_support': row['responsibility_support'],
                    'breakfast_support': row['breakfast_support'],
                    'skill_sessions': int(row['skill_sessions']) if row['skill_sessions'] is not None else 0,
                    'skill_salary': row['skill_salary'],
                    'english_sessions': int(row['english_sessions']) if row['english_sessions'] is not None else 0,
                    'english_salary': row['english_salary'],
                    'new_students_list': row['new_students_list'],
                    'paid_amount': row['paid_amount'],
                    'total_salary': row['total_salary'],
                    'note': row['note'],
                    'name': row['name']
                }
            )
            print(f"{'Created' if created else 'Updated'} teacher: {teacher}")

def main():
    # Use the correct path to the sample_data directory
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'sample_data'))
    student_csv_path = os.path.join(base_path, 'student_202505150207.csv')
    teacher_csv_path = os.path.join(base_path, 'teacher_202505150207.csv')
    
    print(f"Looking for CSV files at: {base_path}")
    print(f"Student CSV path: {student_csv_path}")
    print(f"Teacher CSV path: {teacher_csv_path}")
    
    if os.path.exists(student_csv_path):
    import_students(student_csv_path)
    else:
        print(f"Error: Student CSV file not found at {student_csv_path}")
    
    if os.path.exists(teacher_csv_path):
    import_teachers(teacher_csv_path)
    else:
        print(f"Error: Teacher CSV file not found at {teacher_csv_path}")

if __name__ == '__main__':
    main() 