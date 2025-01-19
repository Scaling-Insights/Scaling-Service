import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1736764214678 implements MigrationInterface {
    name = 'Initial1736764214678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "metrics" ("id" BIGSERIAL NOT NULL, "total_cpu" double precision NOT NULL, "avg_usage_cpu" double precision NOT NULL, "total_ram" double precision NOT NULL, "avg_usage_ram" double precision NOT NULL, "average_request" double precision, "average_latency_request" double precision, "time" TIMESTAMP NOT NULL DEFAULT now(), "nodecount" integer NOT NULL, CONSTRAINT "PK_5283cad666a83376e28a715bf0e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "metrics"`);
    }

}
