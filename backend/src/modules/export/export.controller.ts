import { Controller, Post, Body, UseGuards, Res, Sse, Get, Query } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Readable } from 'stream';

interface ExportProgress {
  processed: number;
  total: number;
}

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export multiple receipts/salary slips' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['student', 'teacher'] },
        ids: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async bulkExport(
    @Body() body: { type: 'student' | 'teacher'; ids: string[] },
    @Res() res: Response
  ) {
    try {
      const { stream, total } = await this.exportService.bulkExport(body.type, body.ids);
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="MONKIDS_${body.type === 'student' ? 'Student' : 'Teacher'}_Export.zip"`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Total-Items': total.toString(),
      });

      stream.pipe(res);

      // Handle errors
      stream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        }
      });

    } catch (error) {
      console.error('Export error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: error.message || 'Failed to generate export file',
          error: error
        });
      }
    }
  }

  @Get('progress')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get export progress' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['student', 'teacher'] },
        ids: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @Sse('progress')
  async getProgress(
    @Query('type') type: 'student' | 'teacher',
    @Query('ids') ids: string
  ): Promise<Observable<{ data: ExportProgress }>> {
    const idArray = ids.split(',');
    const { stream, total } = await this.exportService.bulkExport(type, idArray);
    
    return new Observable<{ data: ExportProgress }>(subscriber => {
      stream.on('progress', (progress: ExportProgress) => {
        subscriber.next({ data: progress });
      });

      stream.on('error', (error) => {
        subscriber.error(error);
      });

      stream.on('end', () => {
        subscriber.complete();
      });
    });
  }
} 