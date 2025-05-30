import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { StudentsService } from '../services/students.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { BulkDeleteDto } from '../dto/bulk-delete.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Response } from 'express';
import * as fs from 'fs';
import * as archiver from 'archiver';
import { UserRole } from 'src/modules/users/entities/user.entity';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create student' })
  @ApiResponse({ status: 201, description: 'Student created' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get all students (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.studentsService.findAll(paginationDto);
  }

  @Get(':sequential_number')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get student by sequential_number' })
  findOne(@Param('sequential_number') sequential_number: string) {
    return this.studentsService.findOne(sequential_number);
  }

  @Patch(':sequential_number')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update student' })
  update(
    @Param('sequential_number') sequential_number: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(sequential_number, updateStudentDto);
  }

  @Delete(':sequential_number')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete student' })
  remove(@Param('sequential_number') sequential_number: string) {
    return this.studentsService.remove(sequential_number);
  }

  @Post('bulk-delete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete multiple students' })
  @ApiResponse({ status: 200, description: 'Students deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'No students found with the provided IDs',
  })
  bulkRemove(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.studentsService.bulkRemove(bulkDeleteDto);
  }

  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Export selected student receipts' })
  @ApiResponse({ status: 200, description: 'Zip file of receipts generated successfully', type: 'application/zip' })
  @ApiResponse({ status: 404, description: 'No students found with the provided IDs' })
  async exportSelected(
    @Body() body: { files: { name: string, dataUrl: string, classroom?: string }[] },
    @Res() res: Response
  ): Promise<void> {
    const { files } = body;
    if (!files || files.length === 0) {
      res.status(400).send('No files provided for export');
      return;
    }

    try {
      const zipFilePath = await this.studentsService.exportReceipts(files);

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="MONKIDS_Student_Receipts.zip"`,
      });

      const fileStream = fs.createReadStream(zipFilePath);
      fileStream.pipe(res);

      // Clean up the temporary zip file after sending
      fileStream.on('end', () => {
        fs.unlink(zipFilePath, (err) => {
          if (err) console.error('Error deleting temporary zip file:', err);
        });
      });

    } catch (error) {
      console.error('Export failed:', error);
      if (error instanceof NotFoundException) {
         res.status(404).send(error.message);
      } else {
        res.status(500).send('Failed to generate export file');
      }
    }
  }
}
