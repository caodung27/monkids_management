import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StatsService } from './stats.service';

@Injectable()
export class CronService implements OnModuleInit {
  constructor(private readonly statsService: StatsService) {}

  onModuleInit() {
    // Update stats when the application starts
    this.updateMonthlyStats();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateMonthlyStats() {
    try {
      await this.statsService.updateMonthlyStats();
      console.log('Monthly stats updated successfully');
    } catch (error) {
      console.error('Error updating monthly stats:', error);
    }
  }
} 