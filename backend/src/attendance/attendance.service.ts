import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherAttendance } from './entities/teacher-attendance.entity';
// Import DTOs when created
// import { CreateTeacherAttendanceDto } from './dto/create-teacher-attendance.dto';
// import { UpdateTeacherAttendanceDto } from './dto/update-teacher-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(TeacherAttendance)
    private attendanceRepository: Repository<TeacherAttendance>,
  ) {}

  async createOrUpdate(
    teacherId: string,
    year: number,
    month: number,
    attendanceData: { full_days?: number[], half_days?: number[], absent_days?: number[], extra_days?: number[] },
  ): Promise<TeacherAttendance> {
    let attendanceRecord = await this.attendanceRepository.findOne({
      where: { teacherId: teacherId, year: year, month: month },
    });

    if (!attendanceRecord) {
      attendanceRecord = this.attendanceRepository.create({ teacherId: teacherId, year: year, month: month });
    }

    // Update attendance data lists, ensuring they are correctly formatted arrays
    if (attendanceData.full_days !== undefined) {
      attendanceRecord.full_days = typeof attendanceData.full_days === 'string'
        ? JSON.parse(attendanceData.full_days)
        : attendanceData.full_days;
    }
    if (attendanceData.half_days !== undefined) {
       attendanceRecord.half_days = typeof attendanceData.half_days === 'string'
        ? JSON.parse(attendanceData.half_days)
        : attendanceData.half_days;
    }
    if (attendanceData.absent_days !== undefined) {
       attendanceRecord.absent_days = typeof attendanceData.absent_days === 'string'
        ? JSON.parse(attendanceData.absent_days)
        : attendanceData.absent_days;
    }
    if (attendanceData.extra_days !== undefined) {
       attendanceRecord.extra_days = typeof attendanceData.extra_days === 'string'
        ? JSON.parse(attendanceData.extra_days)
        : attendanceData.extra_days;
    }

    // Ensure empty arrays are saved as empty arrays if incoming is null/undefined
     attendanceRecord.full_days = attendanceRecord.full_days ?? [];
     attendanceRecord.half_days = attendanceRecord.half_days ?? [];
     attendanceRecord.absent_days = attendanceRecord.absent_days ?? [];
     attendanceRecord.extra_days = attendanceRecord.extra_days ?? [];

    return this.attendanceRepository.save(attendanceRecord);
  }

  async findOne(teacherId: string, year: number, month: number): Promise<TeacherAttendance | null> {
    return this.attendanceRepository.findOne({
      where: { teacherId: teacherId, year: year, month: month },
    });
  }

  async getAttendanceWithTotals(
    teacherId: string,
    year: number,
    month: number,
  ): Promise<any> { // Consider creating a DTO for the return type
    const attendance = await this.findOne(teacherId, year, month);

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    const calculatedTotals = this.calculateTotals(attendance, year, month);

    return { ...attendance, ...calculatedTotals };
  }

  private calculateTotals(
    attendance: TeacherAttendance,
    year: number,
    month: number,
  ): { teaching_days: number; absence_days: number; extra_teaching_days: number } {
    let teaching_days = 0;
    let absence_days = 0;
    let extra_teaching_days = 0;

    const daysInMonth = new Date(year, month, 0).getDate();

    // Helper function to get day of the week (0 for Sunday, 1 for Monday, ... 6 for Saturday)
    const getDayOfWeek = (day: number): number => {
      return new Date(year, month - 1, day).getDay();
    };

    // Calculate totals from full_days
    attendance.full_days?.forEach(day => {
      const dayOfWeek = getDayOfWeek(day);
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        teaching_days += 1;
      } else if (dayOfWeek === 6) { // Saturday
        extra_teaching_days += 1;
      }
    });

    // Calculate totals from half_days (assuming half days contribute 0.5 to teaching_days/extra_teaching_days)
    attendance.half_days?.forEach(day => {
      const dayOfWeek = getDayOfWeek(day);
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        teaching_days += 0.5;
      } else if (dayOfWeek === 6) { // Saturday
        extra_teaching_days += 0.5;
      }
    });

    // Calculate totals from absent_days (only count Mon-Fri as absence_days as per rule)
    attendance.absent_days?.forEach(day => {
        const dayOfWeek = getDayOfWeek(day);
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            absence_days += 1;
        }
    });

    // Calculate totals from extra_days (assuming extra days contribute 1 to extra_teaching_days)
     attendance.extra_days?.forEach(day => {
        const dayOfWeek = getDayOfWeek(day);
         // Check if it is Saturday (6) or Sunday (0) for extra days - adjust as needed
        if (dayOfWeek === 6) { // Saturday
            extra_teaching_days += 1;
        } else if (dayOfWeek === 0) { // Sunday - assuming Sundays in extra_days also count
             extra_teaching_days += 1;
        }
    });

    return { teaching_days, absence_days, extra_teaching_days };
  }
} 