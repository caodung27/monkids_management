import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')
django.setup()

from src.app.models import Student, Teacher

def check_data():
    # Count students and teachers
    student_count = Student.objects.count()
    teacher_count = Teacher.objects.count()
    
    print(f"Total Students: {student_count}")
    print(f"Total Teachers: {teacher_count}")
    
    # Show some examples of student data
    if student_count > 0:
        print("\nSample Student Data:")
        for student in Student.objects.all()[:5]:
            print(f"ID: {student.student_id}, Name: {student.name}, Class: {student.classroom}, Total Fee: {student.total_fee}")
    
    # Show some examples of teacher data
    if teacher_count > 0:
        print("\nSample Teacher Data:")
        for teacher in Teacher.objects.all()[:5]:
            print(f"Name: {teacher.name}, Role: {teacher.role}, Total Salary: {teacher.total_salary}")

if __name__ == '__main__':
    check_data() 