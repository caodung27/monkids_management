import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import * as puppeteer from 'puppeteer';
import { renderStudentReceiptHTML } from './templates/student-receipt.template';
import { renderTeacherSalaryHTML } from './templates/teacher-salary.template';
import { In } from 'typeorm';
import { ScreenshotOptions } from 'puppeteer';

@Injectable()
export class ExportService {
  private readonly BATCH_SIZE = 5;
  private readonly MAX_CONCURRENT = 3;
  private browser: puppeteer.Browser;

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {
    // Khởi tạo browser khi service được tạo
    this.initBrowser();
  }

  private async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--single-process',
        '--no-zygote'
      ],
      env: {
        DISPLAY: ':99'
      }
    });
  }

  async onModuleDestroy() {
    // Đóng browser khi service bị hủy
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async generateImage(html: string, outputPath: string): Promise<void> {
    if (!this.browser.isConnected()) {
      await this.initBrowser();
    }

    const page = await this.browser.newPage();
    try {
      await page.setViewport({
        width: 850,
        height: 1100,
        deviceScaleFactor: 2,
      });

      await page.setContent(html, {
        waitUntil: ['domcontentloaded', 'networkidle0']
      });

      await page.waitForSelector('#qr-img', { timeout: 1000 }).catch(() => {});

      const element = await page.$('#receipt-root');
      if (element) {
        const imagePath = outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`;
        const options: ScreenshotOptions = {
          path: imagePath as `${string}.png`,
          type: 'png',
          omitBackground: true
        };
        await element.screenshot(options);
      }
    } finally {
      await page.close();
    }
  }

  async bulkExport(type: 'student' | 'teacher', ids: string[]) {
    const now = new Date();
    const currentMonth = format(now, 'MM');
    const currentYear = format(now, 'yyyy');
    const baseDir = path.join(process.cwd(), 'public', 'exports', `MONKIDS_T${currentMonth}_${currentYear}`);
    
    try {
      await fs.promises.mkdir(baseDir, { recursive: true });

      if (type === 'student') {
        await this.exportStudentReceipts(ids, baseDir, currentMonth, currentYear);
      } else {
        await this.exportTeacherSalarySlips(ids, baseDir, currentMonth, currentYear);
      }

      const zipFileName = `MONKIDS_T${currentMonth}_${currentYear}.zip`;
      const zipFilePath = path.join(process.cwd(), 'public', 'exports', zipFileName);
      await this.createZipFile(baseDir, zipFilePath);

      await fs.promises.rm(baseDir, { recursive: true, force: true });

      return {
        success: true,
        zipPath: zipFilePath,
        message: 'Export completed successfully',
      };
    } catch (error) {
      try {
        await fs.promises.rm(baseDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up after failed export:', cleanupError);
      }
      throw error;
    }
  }

  private async processBatch(
    students: Student[], 
    baseDir: string, 
    currentMonth: string, 
    currentYear: string
  ): Promise<void> {
    await Promise.all(students.map(async (student) => {
      const classroom = student.classroom || 'Other';
      const classroomDir = path.join(baseDir, classroom);
      await fs.promises.mkdir(classroomDir, { recursive: true });

      const html = renderStudentReceiptHTML(student, parseInt(currentMonth), parseInt(currentYear));
      const fileName = `${student.name || 'Unknown'}_${student.student_id}.png`;
      const filePath = path.join(classroomDir, this.sanitizeFileName(fileName));
      await this.generateImage(html, filePath);
    }));
  }

  private async exportStudentReceipts(ids: string[], baseDir: string, currentMonth: string, currentYear: string) {
    const students = await this.studentRepository.findByIds(ids);
    if (!students || students.length === 0) {
      throw new NotFoundException('No students found with the provided IDs');
    }

    const batches: Student[][] = [];
    for (let i = 0; i < students.length; i += this.BATCH_SIZE) {
      batches.push(students.slice(i, i + this.BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i += this.MAX_CONCURRENT) {
      const currentBatches = batches.slice(i, i + this.MAX_CONCURRENT);
      await Promise.all(
        currentBatches.map(batch => 
          this.processBatch(batch, baseDir, currentMonth, currentYear)
        )
      );
    }
  }

  private async exportTeacherSalarySlips(ids: string[], baseDir: string, currentMonth: string, currentYear: string) {
    const teachers = await this.teacherRepository.find({
      where: {
        id: In(ids)
      }
    });
    if (!teachers || teachers.length === 0) {
      throw new NotFoundException('No teachers found with the provided IDs');
    }

    const teacherDir = path.join(baseDir, `GV_Thang${currentMonth}`);
    await fs.promises.mkdir(teacherDir, { recursive: true });

    const batches: Teacher[][] = [];
    for (let i = 0; i < teachers.length; i += this.BATCH_SIZE) {
      batches.push(teachers.slice(i, i + this.BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i += this.MAX_CONCURRENT) {
      const currentBatches = batches.slice(i, i + this.MAX_CONCURRENT);
      await Promise.all(
        currentBatches.map(async (batch) => {
          await Promise.all(batch.map(async (teacher) => {
            const html = renderTeacherSalaryHTML(teacher, parseInt(currentMonth), parseInt(currentYear));
            const fileName = `${teacher.name || 'Unknown'}_${teacher.teacher_no}.png`;
            const filePath = path.join(teacherDir, this.sanitizeFileName(fileName));
            await this.generateImage(html, filePath);
          }));
        })
      );
    }
  }

  private async createZipFile(sourceDir: string, zipPath: string): Promise<void> {
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
      forceLocalTime: true
    });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log('Archive has been finalized and the output file descriptor has closed.');
        resolve();
      });

      output.on('end', () => {
        console.log('Data has been drained');
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archive warning:', err);
        } else {
          reject(err);
        }
      });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  }
} 