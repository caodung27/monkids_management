from django.apps import AppConfig

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.app'
    label = 'app'  # This ensures Django uses 'app' as the prefix for database tables 