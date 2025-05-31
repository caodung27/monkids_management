import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

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
      
      if (!result.zipPath || !fs.existsSync(result.zipPath)) {
        return res.status(404).json({ message: 'Export file not found' });
      }

      const stats = fs.statSync(result.zipPath);
      const currentDate = new Date();
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = currentDate.getFullYear();
      const fileName = `MONKIDS_T${currentMonth}_${currentYear}.zip`;

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      const fileStream = fs.createReadStream(result.zipPath);
      
      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        }
      });

      fileStream.pipe(res);

      // Clean up the zip file after sending
      res.on('finish', () => {
        fs.unlink(result.zipPath, (err) => {
          if (err) console.error('Error deleting temporary zip file:', err);
        });
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