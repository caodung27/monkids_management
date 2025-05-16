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
    # Create User table (Custom User model)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_user (
        id uuid NOT NULL PRIMARY KEY,
        password character varying(128) NOT NULL,
        last_login timestamp with time zone NULL,
        is_superuser boolean NOT NULL,
        is_staff boolean NOT NULL,
        is_active boolean NOT NULL,
        date_joined timestamp with time zone NOT NULL,
        username character varying(150) NULL UNIQUE,
        email character varying(254) NOT NULL UNIQUE,
        first_name character varying(150) NULL,
        last_name character varying(150) NULL,
        google_id character varying(255) NULL UNIQUE,
        profile_picture character varying(500) NULL,
        is_teacher boolean NOT NULL,
        is_admin boolean NOT NULL
    );
    """)
    
    # Create Django migrations table if it doesn't exist
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS django_migrations (
        id bigserial NOT NULL PRIMARY KEY,
        app character varying(255) NOT NULL,
        name character varying(255) NOT NULL,
        applied timestamp with time zone NOT NULL
    );
    """)
    
    # Create Social Auth tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS social_auth_usersocialauth (
        id bigserial NOT NULL PRIMARY KEY,
        provider character varying(32) NOT NULL,
        uid character varying(255) NOT NULL,
        extra_data text NOT NULL,
        user_id uuid NOT NULL REFERENCES app_user(id),
        created timestamp with time zone NOT NULL,
        modified timestamp with time zone NOT NULL,
        UNIQUE (provider, uid)
    );
    """)
    
    # Create auth session table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS django_session (
        session_key character varying(40) NOT NULL PRIMARY KEY,
        session_data text NOT NULL,
        expire_date timestamp with time zone NOT NULL
    );
    """)
    
    # Create index on session expire date
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS django_session_expire_date_idx ON django_session (expire_date);
    """)
    
    # Create blacklisted tokens table for JWT
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS token_blacklist_blacklistedtoken (
        id bigserial NOT NULL PRIMARY KEY,
        blacklisted_at timestamp with time zone NOT NULL,
        token_id bigint NOT NULL UNIQUE
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS token_blacklist_outstandingtoken (
        id bigserial NOT NULL PRIMARY KEY,
        token text NOT NULL,
        created_at timestamp with time zone NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        user_id uuid NULL REFERENCES app_user(id),
        jti character varying(255) NOT NULL UNIQUE
    );
    """)
    
    print("Auth tables created successfully!") 