import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Import modules
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { AuthModule } from './modules/auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatsModule } from './modules/stats.module';
import { CronService } from './services/cron.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'monkid_management',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    StudentsModule,
    TeachersModule,
    AuthModule,
    StatsModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [AppService, CronService],
})
export class AppModule {}
