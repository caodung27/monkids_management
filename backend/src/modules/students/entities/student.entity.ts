import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Transform } from 'class-transformer';

@Entity('app_student')
export class Student {
  @PrimaryColumn({ name: 'sequential_number', type: 'uuid' })
  sequential_number: string;

  @Column({ name: 'student_id' })
  student_id: number;

  @Column({ name: 'name', nullable: true })
  name?: string;

  @Column({ name: 'birthdate', type: 'date', nullable: true })
  birthdate?: Date;

  @Column({ name: 'classroom', length: 50, nullable: true })
  classroom?: string;

  @Column({ name: 'base_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  base_fee: number;

  @Column({ name: 'discount_percentage', type: 'double precision', default: 0 })
  @Transform(({ value }) => Number(value))
  discount_percentage: number;

  @Column({ name: 'final_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  final_fee: number;

  @Column({ name: 'utilities_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  utilities_fee: number;

  @Column({ name: 'pt', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  pt: number;

  @Column({ name: 'pm', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  pm: number;

  @Column({ name: 'meal_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  meal_fee: number;

  @Column({ name: 'eng_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  eng_fee: number;

  @Column({ name: 'skill_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  skill_fee: number;

  @Column({ name: 'total_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  total_fee: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  paid_amount: number;

  @Column({ name: 'remaining_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  remaining_amount: number;

  @Column({ name: 'student_fund', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  student_fund: number;

  @Column({ name: 'facility_fee', type: 'numeric', precision: 10, scale: 2, default: 0 })
  @Transform(({ value }) => Number(value))
  facility_fee: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 