import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTeacherDecimalFieldsManual1717000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_teacher"
            ALTER COLUMN "teaching_days" TYPE numeric(5,1) USING "teaching_days"::numeric,
            ALTER COLUMN "absence_days" TYPE numeric(5,1) USING "absence_days"::numeric,
            ALTER COLUMN "extra_teaching_days" TYPE numeric(5,1) USING "extra_teaching_days"::numeric,
            ALTER COLUMN "skill_sessions" TYPE numeric(5,1) USING "skill_sessions"::numeric,
            ALTER COLUMN "english_sessions" TYPE numeric(5,1) USING "english_sessions"::numeric;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_teacher"
            ALTER COLUMN "teaching_days" TYPE integer USING round("teaching_days"),
            ALTER COLUMN "absence_days" TYPE integer USING round("absence_days"),
            ALTER COLUMN "extra_teaching_days" TYPE integer USING round("extra_teaching_days"),
            ALTER COLUMN "skill_sessions" TYPE integer USING round("skill_sessions"),
            ALTER COLUMN "english_sessions" TYPE integer USING round("english_sessions");
        `);
    }
} 