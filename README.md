# Monkid Management System

## System Overview

This is a modern web application built with a microservices architecture, consisting of three main components:

1. **Frontend (Next.js Application)**
2. **Backend (NestJS API Server)**
3. **Nginx (Reverse Proxy & SSL Termination)**

## Technology Stack

### Frontend
- **Framework**: Next.js 14
- **UI Libraries**: 
  - Mantine UI (v8)
  - TailwindCSS
  - Chart.js for data visualization
- **State Management**: 
  - Redux Toolkit
  - React Query
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Clerk
- **Internationalization**: next-intl
- **Development Tools**:
  - TypeScript
  - ESLint & Prettier
  - Storybook
  - Playwright for E2E testing
  - Vitest for unit testing
  - Husky for git hooks
  - Commitizen for standardized commits

### Backend
- **Framework**: NestJS 9
- **Database**: PostgreSQL with TypeORM
- **Authentication**: 
  - JWT
  - Passport.js
  - Google OAuth2.0
- **API Documentation**: Swagger
- **Features**:
  - PDF Generation (PDFKit)
  - Image Processing (Sharp)
  - File Archiving (Archiver)
  - Scheduled Tasks (@nestjs/schedule)
- **Development Tools**:
  - TypeScript
  - Jest for testing
  - TypeORM Migrations

### Infrastructure
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt
- **Containerization**: Docker & Docker Compose

## Architecture Overview

The system follows a modern microservices architecture with the following key characteristics:

1. **Frontend (Client Layer)**
   - Server-side rendered React application
   - Protected routes with authentication
   - Responsive design with modern UI components
   - Real-time data fetching and caching
   - Multi-language support

2. **Backend (API Layer)**
   - RESTful API endpoints
   - JWT-based authentication
   - Database migrations and TypeORM entities
   - File handling and processing
   - Scheduled tasks and background jobs

3. **Nginx (Gateway Layer)**
   - SSL termination
   - Reverse proxy to backend services
   - CORS configuration
   - Security headers
   - Load balancing capability
   - Health check endpoints

## Deployment Setup

The application is containerized using Docker and can be deployed using Docker Compose:

```yaml
# Example deployment structure
services:
  frontend:
    # Next.js application
    build: ./frontend
    ports:
      - "3000:3000"

  backend:
    # NestJS application
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  nginx:
    # Nginx reverse proxy
    build: ./nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend

  postgres:
    # PostgreSQL database
    image: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## Security Features

1. **SSL/TLS Configuration**
   - TLS 1.2/1.3 support
   - Strong cipher suites
   - HSTS enabled
   - SSL session caching

2. **HTTP Security Headers**
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Strict-Transport-Security

3. **CORS Configuration**
   - Configurable origins
   - Secure methods and headers
   - Credentials support

## Development Setup

1. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend Development**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. **Database Migrations**
   ```bash
   cd backend
   npm run migration:generate
   npm run migration:run
   ```

## Testing

1. **Frontend Tests**
   - Unit Tests: `npm test`
   - E2E Tests: `npm run test:e2e`
   - Storybook: `npm run storybook`

2. **Backend Tests**
   - Unit Tests: `npm test`
   - E2E Tests: `npm run test:e2e`
   - Coverage: `npm run test:cov`

## Monitoring and Maintenance

1. **Health Checks**
   - Endpoint: `/api/health`
   - Monitors service status
   - Integrated with Nginx

2. **Logging**
   - Nginx access and error logs
   - Application-level logging
   - Debug headers for troubleshooting

## Contributing

1. Use Commitizen for standardized commits
2. Follow the established code style (ESLint + Prettier)
3. Write tests for new features
4. Update documentation as needed

## License

Private and Unlicensed - All rights reserved 