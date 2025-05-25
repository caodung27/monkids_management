import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMonthlyStats1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'monthly_stats',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'year',
            type: 'int',
          },
          {
            name: 'month',
            type: 'int',
          },
          {
            name: 'total_students',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_teachers',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_fees',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_salaries',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add unique constraint for year and month
    await queryRunner.query(`
      ALTER TABLE monthly_stats
      ADD CONSTRAINT UQ_monthly_stats_year_month UNIQUE (year, month);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('monthly_stats');
  }
} 