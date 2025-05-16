"""
URL configuration for monkid_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .app.views import (
    StudentViewSet, TeacherViewSet, UserViewSet, 
    UserPermissionsView, CustomTokenRefreshView,
    LogoutView, SessionToTokenView, complete_google_oauth,
    TokenIntrospectView, DirectAuthView
)
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenVerifyView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.views.generic import RedirectView
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.http import HttpResponseRedirect
from social_django.views import complete

# Create a router and register our ViewSets
router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'users', UserViewSet)

# Swagger/OpenAPI schema view
schema_view = get_schema_view(
   openapi.Info(
      title="MonKids Management API",
      default_version='v1',
      description="""
      API documentation for the MonKids educational management system.
      
      ## Authentication Endpoints:
      
      * **/api/token/** - Get JWT tokens with email/password
      * **/api/token/refresh/** - Refresh JWT tokens
      * **/api/token/verify/** - Verify JWT tokens
      * **/api/auth/google/** - Google OAuth2 login
      * **/api/auth/logout/** - Logout (requires refresh token)
      * **/api/auth/permissions/** - Get current user permissions
      * **/api/users/me/** - Get current user profile
      * **/api/users/register/** - Register new users
      
      ## Resource Endpoints:
      
      * **/api/students/** - Manage student data (CRUD operations)
      * **/api/students/{sequential_number}/fees/** - Get detailed fee information for a specific student
      * **/api/teachers/** - Manage teacher data (CRUD operations)
      * **/api/teachers/{id}/salary/** - Get detailed salary information for a specific teacher
      
      ## Features:
      * Student fees tracking and management
      * Teacher salary and performance tracking
      * Sorting functionality for all list endpoints
      * User authentication with JWT and Google OAuth2
      * Role-based access control (admin, teacher, user)
      """,
      terms_of_service="https://www.google.com/policies/terms/", # Example
      contact=openapi.Contact(email="dung.caoxuan.271@gmail.com"),    # Example
      license=openapi.License(name="BSD License"),             # Example
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

# Define callback view
@csrf_exempt
def social_callback(request):
    """Endpoint for frontend to redirect after social login"""
    frontend_url = 'http://localhost:3000/dashboard'
    return JsonResponse({
        "success": True,
        "redirect_to": frontend_url,
        "message": "Authentication successful! Redirecting to dashboard..."
    })

# Direct redirect to frontend dashboard
def redirect_to_frontend_dashboard(request):
    """Directly redirect to frontend dashboard"""
    return HttpResponseRedirect('http://localhost:3000/dashboard')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Authentication URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/token/introspect/', TokenIntrospectView.as_view(), name='token_introspect'),
    path('api/auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/auth/permissions/', UserPermissionsView.as_view(), name='user_permissions'),
    path('api/auth/session-to-token/', SessionToTokenView.as_view(), name='session_to_token'),
    path('api/auth/direct-auth/', DirectAuthView.as_view(), name='direct-auth'),

    # OAuth paths - use social's complete view but with our custom callback
    # This ensures all necessary arguments get passed to our function
    path('oauth/complete/google-oauth2/', complete, {'backend': 'google-oauth2', 'do_complete': complete_google_oauth}, name='social:complete'),
    path('oauth/', include('social_django.urls', namespace='social')),
    
    # Add direct login shortcuts
    path('auth/google/', RedirectView.as_view(url='/oauth/login/google-oauth2/'), name='google-login'),
    
    # Add OAuth callback endpoint
    path('auth/social-callback/', social_callback, name='social-callback'),
    
    # Add dashboard redirect
    path('dashboard/', redirect_to_frontend_dashboard, name='dashboard-redirect'),
    
    # Swagger UI paths
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] 