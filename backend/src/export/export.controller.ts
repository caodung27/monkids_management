import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('bulk')
  async bulkExport(@Body() body: { type: 'student' | 'teacher'; ids: string[] }) {
    return this.exportService.bulkExport(body.type, body.ids);
  }
} 