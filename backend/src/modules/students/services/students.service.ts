import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { BulkDeleteDto } from '../dto/bulk-delete.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';
import { In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import * as os from 'os';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.studentRepository.findAndCount({
      skip,
      take: limit,
      order: {
        student_id: 'ASC',
      },
    });

    return {
      data,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { sequential_number: id },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async findByStudentId(student_id: number): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { student_id },
    });
    if (!student) {
      throw new NotFoundException(
        `Student with student_id ${student_id} not found`,
      );
    }
    return student;
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Get max student_id to generate new one
    const maxStudentIdResult = await this.studentRepository
      .createQueryBuilder('student')
      .select('MAX(student.student_id)', 'maxStudentId')
      .getRawOne();
    
    const maxStudentId = maxStudentIdResult?.maxStudentId || 0;
    const newStudentId = maxStudentId + 1;

    // Calculate final fee
    const baseFee = Number(createStudentDto.base_fee || 0);
    const discountPercentage = Number(createStudentDto.discount_percentage || 0);
    const finalFee = Math.round(baseFee * (1 - discountPercentage));

    // Calculate meal fee
    const pt = Number(createStudentDto.pt || 0);
    const pm = Number(createStudentDto.pm || 0);
    const mealFee = Math.round((pm - pt) * 30000); // 30000 is MEAL_FEE_PER_TICKET

    // Calculate total fee
    const utilitiesFee = Number(createStudentDto.utilities_fee || 0);
    const engFee = Number(createStudentDto.eng_fee || 0);
    const skillFee = Number(createStudentDto.skill_fee || 0);
    const studentFund = Number(createStudentDto.student_fund || 0);
    const facilityFee = Number(createStudentDto.facility_fee || 0);
    const totalFee = Math.round(
      finalFee + 
      utilitiesFee + 
      mealFee + 
      engFee + 
      skillFee + 
      studentFund + 
      facilityFee
    );

    // Calculate remaining amount
    const paidAmount = Number(createStudentDto.paid_amount || 0);
    const remainingAmount = Math.round(totalFee - paidAmount);

    const student = this.studentRepository.create({
      ...createStudentDto,
      student_id: newStudentId,
      sequential_number: uuidv4(),
      final_fee: finalFee,
      meal_fee: mealFee,
      total_fee: totalFee,
      remaining_amount: remainingAmount,
    });
    return this.studentRepository.save(student);
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, updateStudentDto);
    return this.studentRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
  }

  async bulkRemove(bulkDeleteDto: BulkDeleteDto): Promise<void> {
    const students = await this.studentRepository.findBy({
      sequential_number: In(bulkDeleteDto.ids),
    });
    if (students.length === 0) {
      throw new NotFoundException('No students found with the provided IDs');
    }
    await this.studentRepository.remove(students);
  }

  async exportReceipts(files: { name: string, dataUrl: string, classroom?: string }[]): Promise<string> {
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
    const zipFilePath = path.join(os.tmpdir(), `MONKIDS_Student_Receipts_${exportId}.zip`);

    try {
      // Create temp directory
      await fs.promises.mkdir(tempDir, { recursive: true });
      await fs.promises.mkdir(exportBaseDir, { recursive: true });

      // Process each file
      for (const file of files) {
        const { name, dataUrl, classroom } = file;
        if (!dataUrl || !name) continue;

        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const studentClassroom = classroom || 'Other';
        const classroomDir = path.join(exportBaseDir, studentClassroom);
        await fs.promises.mkdir(classroomDir, { recursive: true });

        const receiptFilePath = path.join(classroomDir, name);
        await fs.promises.writeFile(receiptFilePath, imageBuffer);
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
            console.error('Error cleaning up export directory:', cleanupError);
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
