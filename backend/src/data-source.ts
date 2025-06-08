import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './modules/users/entities/user.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.NODE_ENV === 'production' ? process.env.DATABASE_HOST : 'localhost',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'postgres',
  entities: [User],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
}); 