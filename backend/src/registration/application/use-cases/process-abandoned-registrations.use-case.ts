import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import { IEmailProvider, EMAIL_PROVIDER } from '../../domain/interfaces/email-provider.interface';

@Injectable()
export class ProcessAbandonedRegistrationsUseCase {
  private readonly logger = new Logger(ProcessAbandonedRegistrationsUseCase.name);

  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly registrationRepo: IRegistrationRepository,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(): Promise<{ processed: number; errors: number }> {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    const abandoned = await this.registrationRepo.findAbandoned(threshold);

    let processed = 0;
    let errors = 0;

    for (const registration of abandoned) {
      try {
        await this.emailProvider.sendAbandonmentReminder(registration.email, registration.id);
        registration.abandonmentEmailSentAt = new Date();
        await this.registrationRepo.save(registration);
        processed++;
        this.logger.log(`Abandonment email sent for registration ${registration.id}`);
      } catch (error) {
        errors++;
        this.logger.error(`Failed to process abandoned registration ${registration.id}`, error);
      }
    }

    this.logger.log(`Processed ${processed} abandoned registrations, ${errors} errors`);
    return { processed, errors };
  }
}
