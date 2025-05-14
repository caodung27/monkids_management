from django.db import models
import uuid

class Student(models.Model):
    student_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    classroom = models.CharField(max_length=50, null=True, blank=True)
    base_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percentage = models.FloatField(default=0)
    final_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    utilities_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pt = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pm = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    meal_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    eng_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    skill_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    student_fund = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    facility_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sequential_number = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)

    def __str__(self):
        return f"{self.name} ({self.student_id})"

class Teacher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, null=True, blank=True)
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    teaching_days = models.IntegerField(default=0)
    absence_days = models.IntegerField(default=0)
    received_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    extra_teaching_days = models.IntegerField(default=0)
    extra_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    insurance_support = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    responsibility_support = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    breakfast_support = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    skill_sessions = models.IntegerField(default=0)
    skill_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    english_sessions = models.IntegerField(default=0)
    english_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    new_students_list = models.TextField(null=True, blank=True)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name} ({self.role})" 