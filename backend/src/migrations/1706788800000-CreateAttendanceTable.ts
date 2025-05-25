import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAttendanceTable1706788800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "attendance",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    name: "teacherId",
                    type: "uuid",
                },
                {
                    name: "year",
                    type: "int",
                },
                {
                    name: "month",
                    type: "int",
                },
                {
                    name: "full_days",
                    type: "int",
                    isArray: true,
                    default: "ARRAY[]::INT[]",
                },
                {
                    name: "half_days",
                    type: "int",
                    isArray: true,
                    default: "ARRAY[]::INT[]",
                },
                {
                    name: "absent_days",
                    type: "int",
                    isArray: true,
                    default: "ARRAY[]::INT[]",
                },
                 {
                    name: "extra_days",
                    type: "int",
                    isArray: true,
                    default: "ARRAY[]::INT[]",
                },
            ],
            foreignKeys: [
                {
                    columnNames: ["teacherId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "app_teacher",
                    onDelete: "CASCADE",
                },
            ],
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("attendance");
    }

} 