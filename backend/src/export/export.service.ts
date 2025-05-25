import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Student } from 'src/modules/students/entities/student.entity';
import { Teacher } from 'src/modules/teachers/entities/teacher.entity';
import * as puppeteer from 'puppeteer';
import { renderStudentReceiptHTML } from './templates/student-receipt.template';
import { renderTeacherSalaryHTML } from './templates/teacher-salary.template';
import { Worker } from 'worker_threads';
import * as os from 'os';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async bulkExport(type: 'student' | 'teacher', ids: string[]) {
    try {
      if (type === 'teacher') {
        const teachers = await this.teacherRepository.find({ where: { id: In(ids) } });
        await this.generateTeacherSalarySlips(teachers);
        return { success: true, message: 'Đã xuất phiếu lương thành công' };
      } else {
        const students = await this.studentRepository.findByIds(ids);
        return this.generateStudentReceipts(students);
      }
    } catch (error) {
      console.error('Export bulk error:', error);
      throw new Error(`Failed to export ${type} documents: ${error?.message || error}`);
    }
  }

  private async generateTeacherSalarySlips(teachers: Teacher[]) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dirName = `MONKIDS_T${month}_${year}`;
    const numCPUs = Math.max(Math.floor((os.cpus()?.length || 4) / 2), 2);
    const chunkSize = Math.ceil(teachers.length / numCPUs);
    const teacherChunks = chunkArray(teachers, chunkSize);
    const results = await this.processQueueInBatches(teacherChunks, 'teacher', month, year, dirName, numCPUs);
    return { success: true, message: 'Đã xuất phiếu lương thành công', files: results };
  }

  private async generateStudentReceipts(students: Student[]) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dirName = `MONKIDS_T${month}_${year}`;
    const numCPUs = Math.max(Math.floor((os.cpus()?.length || 4) / 2), 2);
    const chunkSize = Math.ceil(students.length / numCPUs);
    const studentChunks = chunkArray(students, chunkSize);
    const results = await this.processQueueInBatches(studentChunks, 'student', month, year, dirName, numCPUs);
    return { success: true, message: 'Đã xuất biên lai thành công', files: results };
  }

  private async processQueueInBatches(
    chunks: any[][],
    type: 'student' | 'teacher',
    month: number,
    year: number,
    dirName: string,
    maxConcurrent: number
  ): Promise<string[]> {
    const results: string[] = [];
    const queue = [...chunks];
    const activeWorkers = new Set<Worker>();
    let retryCount = 0;
    const maxRetries = 2;

    while (queue.length > 0 || activeWorkers.size > 0) {
      while (activeWorkers.size < maxConcurrent && queue.length > 0) {
        const chunk = queue.shift();
        if (!chunk) continue;

        const worker = await this.runExportWorker(type, chunk, month, year, dirName);
        activeWorkers.add(worker);

        worker.on('message', (result: string[]) => {
          results.push(...result);
          activeWorkers.delete(worker);
        });

        worker.on('error', async (error) => {
          console.error(`Worker error:`, error);
          activeWorkers.delete(worker);
          if (retryCount < maxRetries) {
            retryCount++;
            queue.unshift(chunk);
          }
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
            activeWorkers.delete(worker);
            if (retryCount < maxRetries) {
              retryCount++;
              queue.unshift(chunk);
            }
          }
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  private getWorkerOptions(isTsNode: boolean, workerPath: string, workerData: any) {
    if (isTsNode) {
      return {
        execArgv: [],
        workerData,
        argv: [workerPath]
      };
    }
    return { workerData };
  }

  private async runExportWorker(type: 'student' | 'teacher', items: any[], month: number, year: number, dirName: string): Promise<Worker> {
    const isTsNode = process.argv.some(arg => arg.includes('ts-node')) || process.env.TS_NODE_DEV;
    const workerPath = path.join(__dirname, `export.worker.${isTsNode ? 'ts' : 'js'}`);
    
    return new Promise((resolve, reject) => {
      try {
        const worker = isTsNode
          ? new Worker(require.resolve('ts-node/dist/bin.js'), this.getWorkerOptions(true, workerPath, { type, items, month, year, dirName }))
          : new Worker(workerPath, this.getWorkerOptions(false, workerPath, { type, items, month, year, dirName }));
        resolve(worker);
      } catch (error) {
        reject(error);
      }
    });
  }
}

function vnd(val: number) {
  return (Math.round(val ?? 0)).toLocaleString('vi-VN').replace(/\s/g, '') + 'đ';
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
} 