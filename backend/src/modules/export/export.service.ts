import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  async bulkExport(type: 'student' | 'teacher', ids: string[]) {
    const currentMonth = format(new Date(), 'MM');
    const baseDir = path.join(process.cwd(), `MONKIDS_Thang${currentMonth}`);
    
    // Create base directory
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }

    if (type === 'student') {
      await this.exportStudentReceipts(ids, baseDir, currentMonth);
    } else {
      await this.exportTeacherSalarySlips(ids, baseDir, currentMonth);
    }

    return {
      success: true,
      baseDir,
      message: 'Export completed successfully',
    };
  }

  private async exportStudentReceipts(ids: string[], baseDir: string, currentMonth: string) {
    const students = await this.studentRepository.findByIds(ids);
    const browser = await puppeteer.launch({ headless: true });

    for (const student of students) {
      const classroom = student.classroom || 'Other';
      const classroomDir = path.join(baseDir, classroom);
      
      if (!fs.existsSync(classroomDir)) {
        fs.mkdirSync(classroomDir);
      }

      const page = await browser.newPage();
      await page.goto(`${process.env.FRONTEND_URL}/dashboard/students/${student.sequential_number}/receipt`, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });

      const fileName = `${student.name || 'Unknown'}.pdf`;
      fs.writeFileSync(path.join(classroomDir, fileName), pdf);
      await page.close();
    }

    await browser.close();
  }

  private async exportTeacherSalarySlips(ids: string[], baseDir: string, currentMonth: string) {
    const teachers = await this.teacherRepository.findByIds(ids);
    const browser = await puppeteer.launch({ headless: true });
    const teacherDir = path.join(baseDir, `GV_Thang${currentMonth}`);

    if (!fs.existsSync(teacherDir)) {
      fs.mkdirSync(teacherDir);
    }

    for (const teacher of teachers) {
      const page = await browser.newPage();
      await page.goto(`${process.env.FRONTEND_URL}/dashboard/teachers/${teacher.id}/receipt`, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });

      const fileName = `${teacher.name || 'Unknown'}.pdf`;
      fs.writeFileSync(path.join(teacherDir, fileName), pdf);
      await page.close();
    }

    await browser.close();
  }
} 