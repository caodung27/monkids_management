import os
import django
import csv
import uuid
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monkid.settings')
django.setup()

from monkid.app.models import Teacher

def import_teachers():
    # Path to the CSV file
    csv_path = '../../sample_data/teacher_202505150207.csv'
    
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Generate UUID if not provided
            teacher_id = row.get('id', '')
            if not teacher_id:
                teacher_id = str(uuid.uuid4())
            
            # Basic data for teacher
            teacher, created = Teacher.objects.update_or_create(
                id=uuid.UUID(teacher_id),
                defaults={
                    'name': row.get('name', ''),
                    'role': row.get('role', ''),
                    'phone': row.get('phone', None),
                    'base_salary': float(row.get('base_salary', 0) or 0),
                    'total_salary': float(row.get('total_salary', 0) or 0)
                }
            )
            
            print(f"{'Created' if created else 'Updated'} teacher: {teacher.name}")

if __name__ == '__main__':
    import_teachers()
    print("Teacher import completed.") 