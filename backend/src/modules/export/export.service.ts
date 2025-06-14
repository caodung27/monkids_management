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
  private readonly BATCH_SIZE = 5;
  private readonly MAX_CONCURRENT = 3;
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
    const isProduction = process.env.NODE_ENV === 'production';
    
    const options: any = {
      headless: 'new',
      timeout: 30000,
    };

    if (isProduction) {
      options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
      options.args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--no-zygote',
        '--no-first-run',
        '--window-size=1920,1080',
        '--font-render-hinting=none',
        '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints,PowerBookmarksSidePanel,UsbDeviceMonitor,GlobalMediaControls',
        '--disable-dev-tools',
        '--disable-notifications',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-breakpad',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-print-preview',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-voice-input',
        '--no-experiments',
        '--no-pings',
        '--no-proxy-server',
        '--force-color-profile=srgb',
        '--disable-audio-output',
        '--disable-webgl',
        '--disable-threaded-scrolling',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-video-decode',
        '--disable-gpu-compositing',
        '--disable-logging',
      ];
    }

    this.browser = await puppeteer.launch(options);
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async generateImage(html: string): Promise<Buffer> {
    if (!this.browser || !this.browser.isConnected()) {
      console.log('Browser not connected, reinitializing...');
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
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 30000
      });

      const element = await page.$('#receipt-root');
      if (!element) {
        throw new Error('Receipt root element not found');
      }

      const imageBuffer = await element.screenshot({
        type: 'png',
        omitBackground: true,
        encoding: 'binary'
      });

      return Buffer.from(imageBuffer);
    } finally {
      await page.close().catch(err => console.error('Error closing page:', err));
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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

          // Process students in batches
          for (let i = 0; i < students.length; i += this.BATCH_SIZE) {
            const batch = students.slice(i, i + this.BATCH_SIZE);
            await Promise.all(batch.map(async (student) => {
              const html = renderStudentReceiptHTML(student, parseInt(currentMonth), parseInt(currentYear));
              const imageBuffer = await this.generateImage(html);
              const classroom = student.classroom || 'Other';
              const fileName = `${this.sanitizeFileName(student.name || 'Unknown')}_${student.student_id}.png`;
              
              archive.append(imageBuffer, { name: `${classroom}/${fileName}` });
              processedItems++;
              progressEmitter.emit('progress', { processed: processedItems, total: totalItems });
            }));
          }
        } else {
          const teachers = await this.teacherRepository.find({
            where: { id: In(ids) }
          });
          if (!teachers || teachers.length === 0) {
            throw new NotFoundException('No teachers found with the provided IDs');
          }

          totalItems = teachers.length;

          // Process teachers in batches
          for (let i = 0; i < teachers.length; i += this.BATCH_SIZE) {
            const batch = teachers.slice(i, i + this.BATCH_SIZE);
            await Promise.all(batch.map(async (teacher) => {
              const html = renderTeacherSalaryHTML(teacher, parseInt(currentMonth), parseInt(currentYear));
              const imageBuffer = await this.generateImage(html);
              const fileName = `${this.sanitizeFileName(teacher.name || 'Unknown')}_${teacher.teacher_no}.png`;
              
              archive.append(imageBuffer, { name: `GV_Thang${currentMonth}/${fileName}` });
              processedItems++;
              progressEmitter.emit('progress', { processed: processedItems, total: totalItems });
            }));
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