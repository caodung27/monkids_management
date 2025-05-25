import { Student } from '../entities/student.entity';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { BulkDeleteDto } from '../dto/bulk-delete.dto';

export interface IStudentsService {
  findAll(paginationDto: PaginationDto): Promise<{
    data: Student[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }>;
  findOne(id: string): Promise<Student>;
  findBySequentialNumber(sequential_number: number): Promise<Student>;
  create(createStudentDto: CreateStudentDto): Promise<Student>;
  update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student>;
  remove(id: string): Promise<void>;
  bulkRemove(bulkDeleteDto: BulkDeleteDto): Promise<void>;
} 