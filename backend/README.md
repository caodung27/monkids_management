# Monkid Management Backend

This is the backend service for the Monkid Management system, built with NestJS.

## Features

- User authentication with JWT and Google OAuth2
- Role-based authorization
- CRUD operations for users, students, and teachers
- Swagger API documentation
- PostgreSQL database integration

## Prerequisites

- Node.js (v14 or later)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=monkid_management

# JWT Configuration
JWT_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

4. Create the database:
```bash
createdb monkid_management
```

5. Run database migrations:
```bash
npm run typeorm migration:run
```

## Running the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:
```
http://localhost:3000/api
```

## Authentication

The API uses JWT for authentication. To access protected endpoints:

1. Login using `/auth/login` or `/auth/google`
2. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Authorization

The API implements role-based authorization with two roles:
- ADMIN: Full access to all endpoints
- USER: Read-only access to data

## Project Structure

```
src/
├── modules/
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── students/          # Student management
│   ├── teachers/          # Teacher management
│   └── common/            # Shared resources
├── config/               # Configuration files
└── main.ts              # Application entry point
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License.
