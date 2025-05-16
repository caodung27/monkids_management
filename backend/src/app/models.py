from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    """
    Custom manager for User model
    
    Provides helper methods for creating users and superusers with email as the unique identifier.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)
        
    class Meta:
        app_label = 'app'

class User(AbstractUser):
    """
    Custom User model
    
    Extends Django's AbstractUser to use email as the username field and add social auth fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, null=True, blank=True)
    last_name = models.CharField(max_length=150, null=True, blank=True)
    
    # Social auth fields
    google_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    
    # Role-based fields
    is_teacher = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    def __str__(self):
        return self.email
        
    class Meta:
        app_label = 'app'  # Explicitly set the app label for the User model

class Student(models.Model):
    """
    Student model
    
    Stores information about students including personal details and fee information.
    """
    student_id = models.IntegerField(primary_key=True, help_text="Unique identifier for the student")
    name = models.CharField(max_length=255, null=True, blank=True, help_text="Full name of the student")
    birthdate = models.DateField(null=True, blank=True, help_text="Date of birth")
    classroom = models.CharField(max_length=50, null=True, blank=True, help_text="Classroom assignment")
    base_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Base tuition fee")
    discount_percentage = models.FloatField(default=0, help_text="Discount percentage applied to base fee")
    final_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Final fee after discount")
    utilities_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Additional utilities fee")
    pt = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Parent-Teacher fee")
    pm = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Parent-Management fee")
    meal_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Meal fee")
    eng_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="English class fee")
    skill_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Skill class fee")
    total_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total fee including all components")
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount already paid")
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Remaining amount to be paid")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Date when record was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="Date when record was last updated")
    student_fund = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Student fund contribution")
    facility_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Facility usage fee")
    sequential_number = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True, help_text="UUID for API lookups")

    def __str__(self):
        return f"{self.name} ({self.student_id})"
    
    class Meta:
        app_label = 'app'
        verbose_name = "Student"
        verbose_name_plural = "Students"
        ordering = ['student_id']

class Teacher(models.Model):
    """
    Teacher model
    
    Stores information about teachers including personal details, role, and salary information.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, help_text="Unique identifier for the teacher")
    # Temporarily comment out for testing purposes
    # user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='teacher_profile', help_text="User account associated with this teacher")
    role = models.CharField(max_length=100, help_text="Role or position (e.g., Head Teacher, Assistant)")
    phone = models.CharField(max_length=20, null=True, blank=True, help_text="Contact phone number")
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Base monthly salary")
    teaching_days = models.IntegerField(default=0, help_text="Number of teaching days in the month")
    absence_days = models.IntegerField(default=0, help_text="Number of absence days")
    received_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Salary after absence deductions")
    extra_teaching_days = models.IntegerField(default=0, help_text="Number of extra teaching days")
    extra_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Extra payment for additional work")
    insurance_support = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Insurance support amount")
    responsibility_support = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Additional payment for responsibilities")
    breakfast_support = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Breakfast allowance")
    skill_sessions = models.IntegerField(default=0, help_text="Number of skill sessions taught")
    skill_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Payment for skill teaching")
    english_sessions = models.IntegerField(default=0, help_text="Number of English sessions taught")
    english_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Payment for English teaching")
    new_students_list = models.TextField(null=True, blank=True, help_text="List of new students recruited")
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount already paid")
    total_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total salary including all components")
    note = models.TextField(null=True, blank=True, help_text="Additional notes")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Date when record was created")
    name = models.CharField(max_length=255, help_text="Full name of the teacher")

    def __str__(self):
        return f"{self.name} ({self.role})" 
    
    class Meta:
        app_label = 'app'
        verbose_name = "Teacher"
        verbose_name_plural = "Teachers"
        ordering = ['name'] 