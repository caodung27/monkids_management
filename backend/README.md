# MonKids Management System

## Project Overview
MonKids is a comprehensive backend management system for educational institutions, designed to manage student and teacher information with robust financial tracking.

## Project Structure
```
src/
├── monkid/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── views.py
│   ├── __init__.py
│   ├── settings.py
│   └── urls.py
├── import_data.py
└── requirements.txt
```

## Prerequisites
- Python 3.10+
- Django 5.2.1
- PostgreSQL (optional, SQLite is default)

## Setup Instructions

1. Clone the repository
2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up database
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Import initial data
```bash
python import_data.py
```

6. Run the development server
```bash
python manage.py runserver
```

## Features
- Student fee management
- Teacher salary tracking
- REST API endpoints
- CSV data import

## Database Configuration
By default, the project uses SQLite. To use PostgreSQL, update the `DATABASES` configuration in `settings.py`.

## API Endpoints

- Students: `/api/students/`
- Teachers: `/api/teachers/`

## Development Notes

- Uses Django REST Framework for API
- Supports CRUD operations for students and teachers 