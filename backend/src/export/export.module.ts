import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Student } from 'src/modules/students/entities/student.entity';
import { Teacher } from 'src/modules/teachers/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, Student]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {} 