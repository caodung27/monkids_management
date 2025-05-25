import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { TeachersService } from '../services/teachers.service';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { BulkDeleteDto } from '../dto/bulk-delete.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Response } from 'express';
import * as fs from 'fs';
import { NotFoundException } from '@nestjs/common';

@ApiTags('teachers')
@ApiBearerAuth()
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiResponse({ status: 200, description: 'Return all teachers' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.teachersService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Get a teacher by id' })
  @ApiResponse({ status: 200, description: 'Return the teacher' })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new teacher' })
  @ApiResponse({ status: 201, description: 'Teacher created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a teacher' })
  @ApiResponse({ status: 200, description: 'Teacher updated successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a teacher' })
  @ApiResponse({ status: 200, description: 'Teacher deleted successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Post('bulk-delete')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete multiple teachers' })
  @ApiResponse({ status: 200, description: 'Teachers deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'No teachers found with the provided IDs',
  })
  bulkRemove(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.teachersService.bulkRemove(bulkDeleteDto);
  }

  @Post('export')
  @Roles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Export selected teacher salary slips' })
  @ApiResponse({ status: 200, description: 'Zip file of salary slips generated successfully', type: 'application/zip' })
  @ApiResponse({ status: 404, description: 'No teachers found with the provided IDs' })
  async exportSelected(
    @Body() body: { files: { name: string, dataUrl: string }[] },
    @Res() res: Response
  ): Promise<void> {
    const { files } = body;
    if (!files || files.length === 0) {
      res.status(400).send('No files provided for export');
      return;
    }

    try {
      const zipFilePath = await this.teachersService.exportSalarySlips(files);

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="MONKIDS_Teacher_SalarySlips.zip"`,
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
