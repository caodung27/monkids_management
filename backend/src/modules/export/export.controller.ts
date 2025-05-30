import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
  async bulkExport(@Body() body: { type: 'student' | 'teacher'; ids: string[] }) {
    return this.exportService.bulkExport(body.type, body.ids);
  }
} 