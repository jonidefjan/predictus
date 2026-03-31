import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegistrationTable1711900000000 implements MigrationInterface {
  name = 'CreateRegistrationTable1711900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."registrations_status_enum" AS ENUM(
        'pending',
        'mfa_sent',
        'mfa_verified',
        'completed',
        'abandoned'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "registrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying,
        "cpf" character varying,
        "phone" character varying,
        "birthDate" date,
        "cep" character varying,
        "street" character varying,
        "number" character varying,
        "complement" character varying,
        "neighborhood" character varying,
        "city" character varying,
        "state" character varying,
        "password" character varying,
        "status" "public"."registrations_status_enum" NOT NULL DEFAULT 'pending',
        "currentStep" integer NOT NULL DEFAULT 1,
        "mfaCode" character varying,
        "mfaExpiresAt" TIMESTAMP,
        "mfaVerifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_registrations_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "registrations"`);
    await queryRunner.query(`DROP TYPE "public"."registrations_status_enum"`);
  }
}
