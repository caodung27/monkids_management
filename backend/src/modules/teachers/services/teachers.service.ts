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
    // Get total teachers to generate new teacher_no
    const [, total] = await this.teacherRepository.findAndCount();
    const newTeacherNo = total + 1;

    const teacher = this.teacherRepository.create({
      ...createTeacherDto,
      id: uuidv4(),
      teacher_no: newTeacherNo,
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
    // We receive files (images as Data URLs) and their names from the frontend.

    if (!files || files.length === 0) {
      throw new NotFoundException('No files provided for export');
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Define base directory for this export batch (use a temporary directory)
    const tempDir = path.join(__dirname, '..\/..\/..\/tmp'); // Temporary directory
    const exportBaseDir = path.join(tempDir, `MONKIDS_Thang${currentMonth}_${currentYear}`);

    // Create the main month folder if it doesn't exist (might be created by student export)
    await fs.promises.mkdir(exportBaseDir, { recursive: true });

    // 2. Create the teacher-specific folder
    const teachersDir = path.join(exportBaseDir, `GiaoVien_Thang${currentMonth}_${currentYear}`);
    await fs.promises.mkdir(teachersDir, { recursive: true });

    // 3. Process and save each image file
    for (const file of files) {
      const { name, dataUrl } = file;
      if (!dataUrl || !name) continue; // Skip if data is missing

      // Extract base64 data from Data URL
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Define the file path in the teacher directory
      const salaryFilePath = path.join(teachersDir, name);

      // Save the image file
      await fs.promises.writeFile(salaryFilePath, imageBuffer);
    }

    // 4. Create a zip archive of the main month folder
    const zipFileName = `MONKIDS_Thang${currentMonth}_${currentYear}.zip`;
    const zipFilePath = path.join(tempDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(archive.pointer() + ' total bytes');
        console.log('Zip archive has been finalized and the output file descriptor has closed.');
        resolve(zipFilePath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Append the main month directory to the archive
      archive.directory(exportBaseDir, path.basename(exportBaseDir));

      archive.finalize();
    });
  }
}
