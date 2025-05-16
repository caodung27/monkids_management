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
- PostgreSQL (required for production)

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
- JWT-based authentication
- Google OAuth2 integration
- Role-based access control

## Database Configuration
By default, the project uses SQLite. To use PostgreSQL, update the `DATABASES` configuration in `settings.py`.

## API Endpoints

### Authentication
- Login: `/api/token/` (POST)
- Refresh Token: `/api/token/refresh/` (POST)
- Verify Token: `/api/token/verify/` (POST)
- Google Login: `/api/auth/google/` (POST)
- Logout: `/api/auth/logout/` (POST)
- User Permissions: `/api/auth/permissions/` (GET)

### Resources
- Students: `/api/students/`
- Teachers: `/api/teachers/`
- Users: `/api/users/`

## Authentication

### JWT Authentication
The system uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Obtain tokens by sending credentials to `/api/token/`
2. Include the access token in the Authorization header:
   ```
   Authorization: Bearer <access_token>
   ```
3. Refresh expired tokens using `/api/token/refresh/`

### Google OAuth2
To enable Google authentication:

1. Set up OAuth2 credentials in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Create an "OAuth client ID" for Web application
   - Add authorized JavaScript origins (e.g., `http://localhost:3000`)
   - Add authorized redirect URIs (e.g., `http://localhost:3000/auth/callback`)
   - Copy your Client ID and Client Secret

2. Configure environment variables:
   - Create a `.env` file in the backend root directory with:
   ```
   GOOGLE_OAUTH2_CLIENT_ID=your-client-id
   GOOGLE_OAUTH2_CLIENT_SECRET=your-client-secret
   ```

3. Verify the Google OAuth2 settings in `settings.py`:
   ```python
   SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.getenv('GOOGLE_OAUTH2_CLIENT_ID', 'your-client-id')
   SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET', 'your-client-secret')
   SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['email', 'profile']
   ```

4. Test the integration:
   - Frontend should call `/api/auth/google/` with the Google ID token
   - Backend will verify the token and create/login the user

## Google OAuth Authentication

This application provides Google OAuth2 authentication. Here's how it's implemented:

1. The backend uses `social-auth-app-django` to handle the OAuth flow
2. Custom JWT token generation is implemented in the `complete_google_oauth` function in `src/app/views.py`
3. After successful authentication, the user is redirected to the frontend callback URL with tokens

OAuth-related endpoints:
- `/oauth/login/google-oauth2/` - Initiates the Google OAuth login flow
- `/oauth/complete/google-oauth2/` - Handles the OAuth completion and generates tokens

The implementation ensures:
- JWT tokens are generated for authenticated users
- Tokens are passed both as URL parameters and cookies
- Security flags are properly set on cookies
- Detailed logging is available for troubleshooting

### Google OAuth Configuration

To configure Google OAuth:
1. Create a project in Google Cloud Console
2. Set up OAuth 2.0 credentials
3. Configure the authorized redirect URI as `http://localhost:8000/oauth/complete/google-oauth2/`
4. Add your client ID and secret to the Django settings

For more information, refer to the documentation for `social-auth-app-django` and Google OAuth2.

## Development Notes

- Uses Django REST Framework for API
- Supports CRUD operations for students and teachers
- Token blacklisting for secure logout
- Role-based permissions (admin, teacher, regular user) 