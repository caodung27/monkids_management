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
      corsLogger.debug('Checking request headers...');
      
      // Log all headers for debugging
      const req = arguments[1]?.req;
      if (req?.headers) {
        corsLogger.debug('Request headers:', JSON.stringify(req.headers, null, 2));
      }

      // In development, allow undefined origin
      if (!origin && process.env.NODE_ENV !== 'production') {
        corsLogger.debug('Development mode: allowing undefined origin');
        callback(null, true);
        return;
      }

      // Try to get origin from various headers
      const effectiveOrigin = origin || 
        req?.headers?.['x-origin'] || 
        req?.headers?.origin ||
        req?.headers?.referer?.match(/^(https?:\/\/[^\/]+)/)?.[1];

      corsLogger.debug(`Effective origin: ${effectiveOrigin}`);
      corsLogger.debug(`Allowed origins: ${allowedOrigins.join(', ')}`);

      // In development, be more lenient with origins
      if (process.env.NODE_ENV !== 'production') {
        corsLogger.debug('Development mode: allowing all origins');
        callback(null, true);
        return;
      }

      // In production, strictly check origins
      if (!effectiveOrigin) {
        corsLogger.warn('No origin found in production mode');
        callback(new Error('Origin required in production mode'));
        return;
      }

      if (allowedOrigins.includes(effectiveOrigin)) {
        corsLogger.debug(`Origin ${effectiveOrigin} is allowed`);
        callback(null, true);
      } else {
        corsLogger.warn(`Origin ${effectiveOrigin} is not allowed. Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Referer'
    ],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    credentials: true,
    maxAge: 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204
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