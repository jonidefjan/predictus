import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAbandonmentEmailSentAt1711900001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('registrations', new TableColumn({
      name: 'abandonmentEmailSentAt',
      type: 'timestamp',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registrations', 'abandonmentEmailSentAt');
  }
}
