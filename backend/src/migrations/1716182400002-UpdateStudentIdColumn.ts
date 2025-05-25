import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStudentIdColumn1716182400002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_student
      ALTER COLUMN student_id DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_student
      ALTER COLUMN student_id SET NOT NULL;
    `);
  }
} 