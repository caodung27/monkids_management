import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('monthly_stats')
export class MonthlyStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column({ name: 'total_students', type: 'int', default: 0 })
  totalStudents: number;

  @Column({ name: 'total_teachers', type: 'int', default: 0 })
  totalTeachers: number;

  @Column({ name: 'total_fees', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalFees: number;

  @Column({ name: 'total_salaries', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalSalaries: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 