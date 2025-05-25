import { Teacher } from 'src/modules/teachers/entities/teacher.entity';
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';

@Entity('attendance')
@Index(['teacher', 'year', 'month'], { unique: true })
export class TeacherAttendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ name: 'teacherId', type: 'uuid' })
  teacherId: string;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column({ type: 'int', array: true, nullable: true, default: [] })
  full_days: number[];

  @Column({ type: 'int', array: true, nullable: true, default: [] })
  half_days: number[];

  @Column({ type: 'int', array: true, nullable: true, default: [] })
  absent_days: number[];

  @Column({ type: 'int', array: true, nullable: true, default: [] })
  extra_days: number[];
} 