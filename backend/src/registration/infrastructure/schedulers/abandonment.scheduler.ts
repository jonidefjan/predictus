import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessAbandonedRegistrationsUseCase } from '../../application/use-cases/process-abandoned-registrations.use-case';

@Injectable()
export class AbandonmentScheduler {
  private readonly logger = new Logger(AbandonmentScheduler.name);

  constructor(
    private readonly processAbandoned: ProcessAbandonedRegistrationsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleAbandonedRegistrations() {
    this.logger.log('Running abandoned registrations check...');
    const result = await this.processAbandoned.execute();
    this.logger.log(`Abandoned registrations check complete: ${result.processed} processed, ${result.errors} errors`);
  }
}
