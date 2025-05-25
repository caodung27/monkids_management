import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlyStats } from '../entities/monthly-stats.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(MonthlyStats)
    private monthlyStatsRepository: Repository<MonthlyStats>,
  ) {}

  private calculateDiff(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  async getMonthlyStats(year: number, month: number) {
    // Get current month stats
    const currentStats = await this.monthlyStatsRepository.findOne({
      where: { year, month },
    });

    // Get previous month stats
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const prevStats = await this.monthlyStatsRepository.findOne({
      where: { year: prevYear, month: prevMonth },
    });

    const current = {
      totalStudents: currentStats?.totalStudents || 0,
      totalTeachers: currentStats?.totalTeachers || 0,
      totalFees: Number(currentStats?.totalFees || 0),
      totalSalaries: Number(currentStats?.totalSalaries || 0),
    };

    const previous = {
      totalStudents: prevStats?.totalStudents || 0,
      totalTeachers: prevStats?.totalTeachers || 0,
      totalFees: Number(prevStats?.totalFees || 0),
      totalSalaries: Number(prevStats?.totalSalaries || 0),
    };

    // Calculate percentage differences
    const diff = {
      totalStudents: this.calculateDiff(current.totalStudents, previous.totalStudents),
      totalTeachers: this.calculateDiff(current.totalTeachers, previous.totalTeachers),
      totalFees: this.calculateDiff(current.totalFees, previous.totalFees),
      totalSalaries: this.calculateDiff(current.totalSalaries, previous.totalSalaries),
    };

    return {
      current,
      previous,
      diff,
    };
  }

  async updateMonthlyStats() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Calculate current totals using raw queries
    const [totalStudents, totalTeachers, totalFees, totalSalaries] = await Promise.all([
      this.monthlyStatsRepository.query('SELECT COUNT(*) FROM app_student'),
      this.monthlyStatsRepository.query('SELECT COUNT(*) FROM app_teacher'),
      this.monthlyStatsRepository.query('SELECT COALESCE(SUM(total_fee), 0) FROM app_student'),
      this.monthlyStatsRepository.query('SELECT COALESCE(SUM(total_salary), 0) FROM app_teacher'),
    ]);

    // Update or create monthly stats
    let monthlyStats = await this.monthlyStatsRepository.findOne({
      where: { year, month },
    });

    if (!monthlyStats) {
      monthlyStats = this.monthlyStatsRepository.create({
        year,
        month,
      });
    }

    monthlyStats.totalStudents = Number(totalStudents[0].count);
    monthlyStats.totalTeachers = Number(totalTeachers[0].count);
    monthlyStats.totalFees = Number(totalFees[0].coalesce);
    monthlyStats.totalSalaries = Number(totalSalaries[0].coalesce);

    await this.monthlyStatsRepository.save(monthlyStats);
  }
} 