import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const corsLogger = new Logger('CORS');

  // CORS configuration for both development and production
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://www.monkids.site']
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      corsLogger.debug(`Incoming request from origin: ${origin}`);
      
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        corsLogger.debug('Development mode: allowing all origins');
        callback(null, true);
        return;
      }

      // In production, check against allowed origins
      if (!origin) {
        corsLogger.debug('No origin provided, allowing request');
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        corsLogger.debug(`Origin ${origin} is allowed`);
        callback(null, true);
      } else {
        corsLogger.warn(`Origin ${origin} is not allowed`);
        callback(null, allowedOrigins[0]);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    maxAge: 3600
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Monkid Management API')
    .setDescription('The Monkid Management API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start the server
  const port = process.env.PORT || 8000;
  await app.listen(port);
  logger.log(`Application is running on port: ${port}`);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});