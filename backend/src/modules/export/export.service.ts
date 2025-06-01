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
import { PassThrough } from 'stream';

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
      options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
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
        '--disable-remote-fonts',
        '--disable-reading-from-canvas'
      ];
      options.ignoreDefaultArgs = ['--enable-automation'];
      options.env = {
        ...process.env,
        DISPLAY: ':99',
        DISABLE_SETUID_SANDBOX: '1',
        DISABLE_DEV_SHM_USAGE: '1'
      };
      options.pipe = true;
      options.dumpio = false;
    }

    try {
      this.browser = await puppeteer.launch(options);
      console.log('Browser launched successfully');
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw error;
    }
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

  async bulkExport(type: 'student' | 'teacher', ids: string[]) {
    const now = new Date();
    const currentMonth = format(now, 'MM');
    const currentYear = format(now, 'yyyy');

    // Create a PassThrough stream for the ZIP file
    const zipStream = new PassThrough();
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Pipe archive data to the zip stream
    archive.pipe(zipStream);

    try {
      if (type === 'student') {
        const students = await this.studentRepository.findByIds(ids);
        if (!students || students.length === 0) {
          throw new NotFoundException('No students found with the provided IDs');
        }

        // Process students in batches
        const batches: Student[][] = [];
        for (let i = 0; i < students.length; i += this.BATCH_SIZE) {
          batches.push(students.slice(i, i + this.BATCH_SIZE));
        }

        for (const batch of batches) {
          await Promise.all(batch.map(async (student) => {
            const html = renderStudentReceiptHTML(student, parseInt(currentMonth), parseInt(currentYear));
            const imageBuffer = await this.generateImage(html);
            const classroom = student.classroom || 'Other';
            const fileName = `${classroom}/${this.sanitizeFileName(student.name || 'Unknown')}_${student.student_id}.png`;
            archive.append(imageBuffer, { name: fileName });
          }));
        }
      } else {
        const teachers = await this.teacherRepository.find({
          where: { id: In(ids) }
        });
        if (!teachers || teachers.length === 0) {
          throw new NotFoundException('No teachers found with the provided IDs');
        }

        // Process teachers in batches
        const batches: Teacher[][] = [];
        for (let i = 0; i < teachers.length; i += this.BATCH_SIZE) {
          batches.push(teachers.slice(i, i + this.BATCH_SIZE));
        }

        for (const batch of batches) {
          await Promise.all(batch.map(async (teacher) => {
            const html = renderTeacherSalaryHTML(teacher, parseInt(currentMonth), parseInt(currentYear));
            const imageBuffer = await this.generateImage(html);
            const fileName = `GV_Thang${currentMonth}/${this.sanitizeFileName(teacher.name || 'Unknown')}_${teacher.teacher_no}.png`;
            archive.append(imageBuffer, { name: fileName });
          }));
        }
      }

      // Finalize the archive
      await archive.finalize();

      return {
        success: true,
        stream: zipStream,
        fileName: `MONKIDS_T${currentMonth}_${currentYear}.zip`
      };
    } catch (error) {
      // If there's an error, destroy the streams
      archive.destroy();
      zipStream.destroy();
      throw error;
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  }
} 