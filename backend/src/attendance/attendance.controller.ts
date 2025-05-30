import { Controller, Get, Post, Body, Param, Put, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { UserRole } from 'src/modules/users/entities/user.entity';
// Import DTOs when created
// import { CreateTeacherAttendanceDto } from './dto/create-teacher-attendance.dto';
// import { UpdateTeacherAttendanceDto } from './dto/update-teacher-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createOrUpdateAttendance(@Body() dailyData: { 
    teacherId: string; 
    year: number; 
    month: number; 
    full_days?: number[]; 
    half_days?: number[]; 
    absent_days?: number[]; 
    extra_days?: number[]; 
  }) {
    const { teacherId, year, month, ...dailyAttendance } = dailyData;
    return this.attendanceService.createOrUpdate(teacherId, year, month, dailyAttendance);
  }

  @Get(':teacherId/:year/:month')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getAttendance(
    @Param('teacherId') teacherId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    // This will return the raw attendance record with daily data
    return this.attendanceService.findOne(teacherId, year, month);
    // You might want to add another endpoint or modify this one
    // to return attendance with calculated totals later.
  }

  // Add other endpoints as needed (e.g., getting attendance for a range, etc.)
} 