import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/common/guards/roles.guard';
import { Roles } from '../modules/common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('total')
  @Roles('ADMIN', 'USER')
  async getMonthlyStats(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const now = new Date();
    const currentYear = year || now.getFullYear();
    const currentMonth = month || now.getMonth() + 1;

    return this.statsService.getMonthlyStats(currentYear, currentMonth);
  }
} 