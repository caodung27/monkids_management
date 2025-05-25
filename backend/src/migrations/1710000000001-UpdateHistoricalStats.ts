import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateHistoricalStats1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all students and teachers
    const students = await queryRunner.query(`
      SELECT created_at 
      FROM app_student 
      ORDER BY created_at ASC
    `);

    const teachers = await queryRunner.query(`
      SELECT created_at 
      FROM app_teacher 
      ORDER BY created_at ASC
    `);

    // Group data by month
    const statsByMonth = new Map<string, {
      totalStudents: number;
      totalTeachers: number;
      totalFees: number;
      totalSalaries: number;
    }>();

    // Process students
    students.forEach((student: { created_at: Date }) => {
      const date = new Date(student.created_at);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const current = statsByMonth.get(key) || {
        totalStudents: 0,
        totalTeachers: 0,
        totalFees: 0,
        totalSalaries: 0
      };
      current.totalStudents++;
      statsByMonth.set(key, current);
    });

    // Process teachers
    teachers.forEach((teacher: { created_at: Date }) => {
      const date = new Date(teacher.created_at);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const current = statsByMonth.get(key) || {
        totalStudents: 0,
        totalTeachers: 0,
        totalFees: 0,
        totalSalaries: 0
      };
      current.totalTeachers++;
      statsByMonth.set(key, current);
    });

    // Insert stats into monthly_stats table
    for (const [key, stats] of statsByMonth) {
      const [year, month] = key.split('-').map(Number);
      await queryRunner.query(`
        INSERT INTO monthly_stats (year, month, total_students, total_teachers, total_fees, total_salaries)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (year, month) DO UPDATE
        SET total_students = $3,
            total_teachers = $4,
            total_fees = $5,
            total_salaries = $6
      `, [year, month, stats.totalStudents, stats.totalTeachers, stats.totalFees, stats.totalSalaries]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No need to implement down migration as this is a one-time data update
  }
} 