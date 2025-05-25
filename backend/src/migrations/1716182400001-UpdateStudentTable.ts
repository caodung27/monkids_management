import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStudentTable1716182400001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_student
      ALTER COLUMN base_fee TYPE decimal(10,2) USING base_fee::decimal,
      ALTER COLUMN discount_percentage TYPE decimal(5,2) USING discount_percentage::decimal,
      ALTER COLUMN final_fee TYPE decimal(10,2) USING final_fee::decimal,
      ALTER COLUMN utilities_fee TYPE decimal(10,2) USING utilities_fee::decimal,
      ALTER COLUMN pt TYPE decimal(10,2) USING pt::decimal,
      ALTER COLUMN pm TYPE decimal(10,2) USING pm::decimal,
      ALTER COLUMN meal_fee TYPE decimal(10,2) USING meal_fee::decimal,
      ALTER COLUMN eng_fee TYPE decimal(10,2) USING eng_fee::decimal,
      ALTER COLUMN skill_fee TYPE decimal(10,2) USING skill_fee::decimal,
      ALTER COLUMN total_fee TYPE decimal(10,2) USING total_fee::decimal,
      ALTER COLUMN paid_amount TYPE decimal(10,2) USING paid_amount::decimal,
      ALTER COLUMN remaining_amount TYPE decimal(10,2) USING remaining_amount::decimal,
      ALTER COLUMN student_fund TYPE decimal(10,2) USING student_fund::decimal,
      ALTER COLUMN facility_fee TYPE decimal(10,2) USING facility_fee::decimal;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_student
      ALTER COLUMN base_fee TYPE numeric(10,2) USING base_fee::numeric,
      ALTER COLUMN discount_percentage TYPE double precision USING discount_percentage::double precision,
      ALTER COLUMN final_fee TYPE numeric(10,2) USING final_fee::numeric,
      ALTER COLUMN utilities_fee TYPE numeric(10,2) USING utilities_fee::numeric,
      ALTER COLUMN pt TYPE numeric(10,2) USING pt::numeric,
      ALTER COLUMN pm TYPE numeric(10,2) USING pm::numeric,
      ALTER COLUMN meal_fee TYPE numeric(10,2) USING meal_fee::numeric,
      ALTER COLUMN eng_fee TYPE numeric(10,2) USING eng_fee::numeric,
      ALTER COLUMN skill_fee TYPE numeric(10,2) USING skill_fee::numeric,
      ALTER COLUMN total_fee TYPE numeric(10,2) USING total_fee::numeric,
      ALTER COLUMN paid_amount TYPE numeric(10,2) USING paid_amount::numeric,
      ALTER COLUMN remaining_amount TYPE numeric(10,2) USING remaining_amount::numeric,
      ALTER COLUMN student_fund TYPE numeric(10,2) USING student_fund::numeric,
      ALTER COLUMN facility_fee TYPE numeric(10,2) USING facility_fee::numeric;
    `);
  }
} 