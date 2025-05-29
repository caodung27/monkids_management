import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '8000', 10),
  database: {
    host: process.env.NODE_ENV === 'production' ? process.env.DATABASE_HOST : 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'monkids',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'monkids',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' ? process.env.GOOGLE_CALLBACK_URL : 'http://localhost:3000/auth/google/callback',
  },
})); 