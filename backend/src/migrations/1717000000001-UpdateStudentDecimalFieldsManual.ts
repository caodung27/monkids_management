import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStudentDecimalFieldsManual1717000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_student"
            ALTER COLUMN "pt" TYPE numeric(5,1) USING "pt"::numeric,
            ALTER COLUMN "pm" TYPE numeric(5,1) USING "pm"::numeric;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_student"
            ALTER COLUMN "pt" TYPE integer USING round("pt"),
            ALTER COLUMN "pm" TYPE integer USING round("pm");
        `);
    }
} 