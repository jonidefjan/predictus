import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import { IEmailProvider, EMAIL_PROVIDER } from '../../domain/interfaces/email-provider.interface';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';
import { generateMfaCode } from '../../../shared/utils/mfa-code.generator';

@Injectable()
export class ResendMfaUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly registrationRepo: IRegistrationRepository,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(id: string): Promise<Omit<Registration, 'mfaCode' | 'password'>> {
    const registration = await this.registrationRepo.findById(id);
    if (!registration) throw new NotFoundException('Registration not found');

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new BadRequestException('Registration is already completed');
    }

    const mfaCode = generateMfaCode();
    const expirationMinutes = parseInt(process.env.MFA_EXPIRATION_MINUTES || '5', 10);
    const mfaExpiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    registration.mfaCode = mfaCode;
    registration.mfaExpiresAt = mfaExpiresAt;
    registration.mfaVerifiedAt = null;
    registration.status = RegistrationStatus.MFA_SENT;

    await this.registrationRepo.save(registration);

    await this.emailProvider.sendMfaCode(registration.email, mfaCode);

    const { mfaCode: _code, password: _password, ...result } = registration as Registration & Record<string, unknown>;
    return result as Omit<Registration, 'mfaCode' | 'password'>;
  }
}
