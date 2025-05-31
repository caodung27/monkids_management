import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

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
      const result = await this.exportService.bulkExport(body.type, body.ids);
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      result.stream.pipe(res);

      result.stream.on('error', (error) => {
        console.error('Error streaming data:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming data' });
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
} 