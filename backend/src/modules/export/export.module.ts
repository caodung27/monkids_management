import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Teacher]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {} 