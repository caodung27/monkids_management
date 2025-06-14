import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { format } from 'date-fns';
import * as puppeteer from 'puppeteer';
import { renderStudentReceiptHTML } from './templates/student-receipt.template';
import { renderTeacherSalaryHTML } from './templates/teacher-salary.template';
import { In } from 'typeorm';
import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Readable, PassThrough } from 'stream';
import { EventEmitter } from 'events';

interface ExportProgress {
  processed: number;
  total: number;
}

@Injectable()
export class ExportService {
  private readonly CHUNK_SIZE = 5;
  private browser: puppeteer.Browser;

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {
    this.initBrowser();
  }

  private async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  private async generateImage(html: string): Promise<Buffer> {
    const page = await this.browser.newPage();
    await page.setContent(html);
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png',
    });
    await page.close();
    return screenshot;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  private async processChunk<T>(
    items: T[],
    processItem: (item: T) => Promise<void>,
    progressEmitter: EventEmitter,
    processedItems: number,
    totalItems: number
  ): Promise<void> {
    await Promise.all(items.map(async (item) => {
      await processItem(item);
      processedItems++;
      progressEmitter.emit('progress', { processed: processedItems, total: totalItems });
    }));
  }

  async bulkExport(type: 'student' | 'teacher', ids: string[]): Promise<{ stream: PassThrough; total: number }> {
    const now = new Date();
    const currentMonth = format(now, 'MM');
    const currentYear = format(now, 'yyyy');
    const exportId = uuidv4();
    let totalItems = 0;

    // Create temporary directory for export
    const tempDir = path.join(os.tmpdir(), `monkids_export_${exportId}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    // Create a pass-through stream for progress tracking
    const progressEmitter = new EventEmitter();
    const passThrough = new PassThrough();

    // Process data in background
    (async () => {
      try {
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(passThrough);

        let processedItems = 0;

        if (type === 'student') {
          const students = await this.studentRepository.find({
            where: { sequential_number: In(ids) }
          });
          if (!students || students.length === 0) {
            throw new NotFoundException('No students found with the provided IDs');
          }

          totalItems = students.length;

          // Process students in chunks
          for (let i = 0; i < students.length; i += this.CHUNK_SIZE) {
            const chunk = students.slice(i, i + this.CHUNK_SIZE);
            await this.processChunk(
              chunk,
              async (student) => {
                const html = renderStudentReceiptHTML(student, parseInt(currentMonth), parseInt(currentYear));
                const imageBuffer = await this.generateImage(html);
                const classroom = student.classroom || 'Other';
                const fileName = `${this.sanitizeFileName(student.name || 'Unknown')}_${student.student_id}.png`;
                archive.append(imageBuffer, { name: `${classroom}/${fileName}` });
              },
              progressEmitter,
              processedItems,
              totalItems
            );
          }
        } else {
          const teachers = await this.teacherRepository.find({
            where: { id: In(ids) }
          });
          if (!teachers || teachers.length === 0) {
            throw new NotFoundException('No teachers found with the provided IDs');
          }

          totalItems = teachers.length;

          // Process teachers in chunks
          for (let i = 0; i < teachers.length; i += this.CHUNK_SIZE) {
            const chunk = teachers.slice(i, i + this.CHUNK_SIZE);
            await this.processChunk(
              chunk,
              async (teacher) => {
                const html = renderTeacherSalaryHTML(teacher, parseInt(currentMonth), parseInt(currentYear));
                const imageBuffer = await this.generateImage(html);
                const fileName = `${this.sanitizeFileName(teacher.name || 'Unknown')}_${teacher.teacher_no}.png`;
                archive.append(imageBuffer, { name: `GV_Thang${currentMonth}/${fileName}` });
              },
              progressEmitter,
              processedItems,
              totalItems
            );
          }
        }

        // Finalize archive
        await archive.finalize();

        // Clean up temp directory
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Clean up in case of error
        try {
          await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
        passThrough.emit('error', error);
      }
    })();

    return {
      stream: passThrough,
      total: totalItems
    };
  }
} 