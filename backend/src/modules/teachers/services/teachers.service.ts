import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { BulkDeleteDto } from '../dto/bulk-delete.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';
import { ITeachersService } from '../interfaces/teachers.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import * as os from 'os';

@Injectable()
export class TeachersService implements ITeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.teacherRepository.findAndCount({
      skip,
      take: limit,
      order: {
        teacher_no: 'ASC',
      },
    });

    return {
      data,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }
    return teacher;
  }

  async findByTeacherNo(teacher_no: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { teacher_no },
    });
    if (!teacher) {
      throw new NotFoundException(
        `Teacher with teacher_no ${teacher_no} not found`,
      );
    }
    return teacher;
  }

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    // Get max teacher_no to generate new one
    const maxTeacherNoResult = await this.teacherRepository
      .createQueryBuilder('teacher')
      .select('MAX(teacher.teacher_no)', 'maxTeacherNo')
      .getRawOne();
    
    const maxTeacherNo = maxTeacherNoResult?.maxTeacherNo || 0;
    const newTeacherNo = maxTeacherNo + 1;

    const teacher = this.teacherRepository.create({
      id: uuidv4(),
      teacher_no: newTeacherNo,
      name: createTeacherDto.name,
      role: createTeacherDto.role,
      phone: createTeacherDto.phone,
      base_salary: createTeacherDto.base_salary || 0,
      teaching_days: createTeacherDto.teaching_days || 0,
      absence_days: createTeacherDto.absence_days || 0,
      received_salary: createTeacherDto.received_salary || 0,
      extra_teaching_days: createTeacherDto.extra_teaching_days || 0,
      extra_salary: createTeacherDto.extra_salary || 0,
      insurance_support: createTeacherDto.insurance_support || 0,
      responsibility_support: createTeacherDto.responsibility_support || 0,
      breakfast_support: createTeacherDto.breakfast_support || 0,
      english_salary: createTeacherDto.english_salary || 0,
      skill_salary: createTeacherDto.skill_salary || 0,
      new_students_list: createTeacherDto.new_students_list ? parseFloat(createTeacherDto.new_students_list) : 0,
      total_salary: createTeacherDto.total_salary || 0,
      note: createTeacherDto.note
    });

    return this.teacherRepository.save(teacher);
  }

  async update(
    id: string,
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<Teacher> {
    const teacher = await this.findOne(id);
    Object.assign(teacher, updateTeacherDto);
    return this.teacherRepository.save(teacher);
  }

  async remove(id: string): Promise<void> {
    const teacher = await this.findOne(id);
    await this.teacherRepository.remove(teacher);
  }

  async bulkRemove(bulkDeleteDto: BulkDeleteDto): Promise<void> {
    const teachers = await this.teacherRepository.findBy({
      id: In(bulkDeleteDto.ids),
    });
    if (teachers.length === 0) {
      throw new NotFoundException('No teachers found with the provided IDs');
    }
    await this.teacherRepository.remove(teachers);
  }

  async exportSalarySlips(files: { name: string, dataUrl: string }[]): Promise<string> {
    if (!files || files.length === 0) {
      throw new NotFoundException('No files provided for export');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const exportId = uuidv4();

    // Use os.tmpdir() for temporary directory
    const tempDir = path.join(os.tmpdir(), `monkids_export_${exportId}`);
    const exportBaseDir = path.join(tempDir, `MONKIDS_Thang${currentMonth}_${currentYear}`);
    const zipFilePath = path.join(os.tmpdir(), `MONKIDS_Teacher_SalarySlips_${exportId}.zip`);

    try {
      // Create temp directory
      await fs.promises.mkdir(tempDir, { recursive: true });
      await fs.promises.mkdir(exportBaseDir, { recursive: true });

      // Create the teacher-specific folder
      const teachersDir = path.join(exportBaseDir, `GiaoVien_Thang${currentMonth}_${currentYear}`);
      await fs.promises.mkdir(teachersDir, { recursive: true });

      // Process each file
      for (const file of files) {
        const { name, dataUrl } = file;
        if (!dataUrl || !name) continue;

        // Extract base64 data from Data URL
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Save the image file
        const salaryFilePath = path.join(teachersDir, name);
        await fs.promises.writeFile(salaryFilePath, imageBuffer);
      }

      // Create zip file
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', async () => {
          try {
            // Clean up all temporary files and directories
            await Promise.all([
              fs.promises.rm(tempDir, { recursive: true, force: true }),
              fs.promises.rm(exportBaseDir, { recursive: true, force: true })
            ]).catch(err => {
              console.error('Error cleaning up temp directories:', err);
            });
            resolve(zipFilePath);
          } catch (cleanupError) {
            console.error('Error cleaning up after export:', cleanupError);
            // Still resolve with zip path even if cleanup fails
            resolve(zipFilePath);
          }
        });

        archive.on('error', (err) => {
          reject(err);
        });

        archive.pipe(output);
        archive.directory(exportBaseDir, path.basename(exportBaseDir));
        archive.finalize();
      });
    } catch (error) {
      // Clean up all temporary files and directories in case of error
      try {
        await Promise.all([
          fs.promises.rm(tempDir, { recursive: true, force: true }),
          fs.promises.rm(exportBaseDir, { recursive: true, force: true }),
          fs.promises.rm(zipFilePath, { force: true })
        ]);
      } catch (cleanupError) {
        console.error('Error cleaning up after failed export:', cleanupError);
      }
      throw error;
    }
  }
}
