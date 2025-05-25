import { Teacher } from '../entities/teacher.entity';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { BulkDeleteDto } from '../dto/bulk-delete.dto';

export interface ITeachersService {
  findAll(paginationDto: PaginationDto): Promise<{
    data: Teacher[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }>;
  findOne(id: string): Promise<Teacher>;
  findByTeacherNo(teacher_no: number): Promise<Teacher>;
  create(createTeacherDto: CreateTeacherDto): Promise<Teacher>;
  update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<Teacher>;
  remove(id: string): Promise<void>;
  bulkRemove(bulkDeleteDto: BulkDeleteDto): Promise<void>;
} 