import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ExportService } from './export.service';

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('bulk')
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
  async bulkExport(@Body() body: { type: 'student' | 'teacher'; ids: string[] }) {
    return this.exportService.bulkExport(body.type, body.ids);
  }
} 