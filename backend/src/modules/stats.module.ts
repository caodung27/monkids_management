import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from '../controllers/stats.controller';
import { StatsService } from '../services/stats.service';
import { MonthlyStats } from '../entities/monthly-stats.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlyStats]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {} 