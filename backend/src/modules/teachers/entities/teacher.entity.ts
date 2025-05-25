import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_teacher')
export class Teacher {
  @PrimaryColumn({ name: 'teacher_no' })
  teacher_no: number;

  @PrimaryColumn({ name: 'id', type: 'uuid' })
  id: string;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name?: string;

  @Column({ name: 'role', length: 100 })
  role: string;

  @Column({ name: 'phone', length: 20, nullable: true })
  phone?: string;

  @Column({
    name: 'base_salary',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  base_salary: number;

  @Column({
    name: 'teaching_days',
    type: 'numeric',
    precision: 5,
    scale: 1,
    default: 0,
  })
  teaching_days: number;

  @Column({
    name: 'absence_days',
    type: 'numeric',
    precision: 5,
    scale: 1,
    default: 0,
  })
  absence_days: number;

  @Column({
    name: 'received_salary',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  received_salary: number;

  @Column({
    name: 'extra_teaching_days',
    type: 'numeric',
    precision: 5,
    scale: 1,
    default: 0,
  })
  extra_teaching_days: number;

  @Column({
    name: 'extra_salary',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  extra_salary: number;

  @Column({
    name: 'insurance_support',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  insurance_support: number;

  @Column({
    name: 'responsibility_support',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  responsibility_support: number;

  @Column({
    name: 'breakfast_support',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  breakfast_support: number;

  @Column({
    name: 'skill_sessions',
    type: 'numeric',
    precision: 5,
    scale: 1,
    default: 0,
  })
  skill_sessions: number;

  @Column({
    name: 'skill_salary',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  skill_salary: number;

  @Column({
    name: 'english_sessions',
    type: 'numeric',
    precision: 5,
    scale: 1,
    default: 0,
  })
  english_sessions: number;

  @Column({
    name: 'english_salary',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  english_salary: number;

  @Column({
    name: 'new_students_list',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  new_students_list: number;

  @Column({
    name: 'paid_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  paid_amount: number;

  @Column({
    name: 'total_salary',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  total_salary: number;

  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
