import { Inject, Injectable } from '@nestjs/common';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import {
  EMAIL_PROVIDER,
  IEmailProvider,
} from '../../domain/interfaces/email-provider.interface';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';
import { generateMfaCode } from '../../../shared/utils/mfa-code.generator';
import { StartRegistrationDto } from '../dtos/start-registration.dto';

@Injectable()
export class StartRegistrationUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationRepository: IRegistrationRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(dto: StartRegistrationDto): Promise<Omit<Registration, 'mfaCode' | 'password'>> {
    const mfaExpirationMinutes = parseInt(
      process.env.MFA_EXPIRATION_MINUTES ?? '5',
      10,
    );

    let registration = await this.registrationRepository.findByEmail(dto.email);

    if (
      registration &&
      (registration.status === RegistrationStatus.PENDING ||
        registration.status === RegistrationStatus.MFA_SENT)
    ) {
      // Reuse existing registration (resume flow)
    } else {
      registration = await this.registrationRepository.create({
        email: dto.email,
        status: RegistrationStatus.PENDING,
        currentStep: 1,
      });
    }

    const mfaCode = generateMfaCode();
    const mfaExpiresAt = new Date(
      Date.now() + mfaExpirationMinutes * 60 * 1000,
    );

    registration.mfaCode = mfaCode;
    registration.mfaExpiresAt = mfaExpiresAt;
    registration.status = RegistrationStatus.MFA_SENT;

    const saved = await this.registrationRepository.save(registration);

    await this.emailProvider.sendMfaCode(saved.email, mfaCode);

    const { mfaCode: _mfaCode, password: _password, ...result } = saved;
    return result as Omit<Registration, 'mfaCode' | 'password'>;
  }
}
