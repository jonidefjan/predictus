import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RegistrationService } from '../../registration.service';

@Injectable()
export class AbandonmentScheduler {
  private readonly logger = new Logger(AbandonmentScheduler.name);

  constructor(private readonly service: RegistrationService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleAbandonedRegistrations() {
    this.logger.log('Running abandoned registrations check...');
    const result = await this.service.processAbandoned();
    this.logger.log(`Abandoned registrations check complete: ${result.processed} processed, ${result.errors} errors`);
  }
}
