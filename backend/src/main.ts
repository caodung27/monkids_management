import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // CORS configuration for both development and production
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://www.monkids.site']
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      const corsLogger = new Logger('CORS');
      corsLogger.debug(`Incoming request from origin: ${origin}`);
      corsLogger.debug('Checking request headers...');
      
      // If origin is undefined and we're in production, check X-Origin header
      if (!origin && process.env.NODE_ENV === 'production') {
        const req = arguments[1]?.req;
        const xOrigin = req?.headers?.['x-origin'];
        corsLogger.debug(`No origin found, checking X-Origin header: ${xOrigin}`);
        origin = xOrigin || origin;
      }

      // In development, allow undefined origin
      if (!origin && process.env.NODE_ENV !== 'production') {
        corsLogger.debug('Development mode: allowing undefined origin');
        callback(null, true);
        return;
      }

      if (!origin || allowedOrigins.includes(origin)) {
        corsLogger.debug(`Origin ${origin} is allowed`);
        callback(null, true);
      } else {
        corsLogger.warn(`Origin ${origin} is not allowed. Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Origin'],
    credentials: true,
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