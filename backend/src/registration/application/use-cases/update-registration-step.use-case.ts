import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { RegistrationStep } from '../../domain/enums/registration-step.enum';
import { generateMfaCode } from '../../../shared/utils/mfa-code.generator';
import { UpdateStepDto } from '../dtos/update-step.dto';

@Injectable()
export class UpdateRegistrationStepUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationRepository: IRegistrationRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(id: string, dto: UpdateStepDto): Promise<Registration> {
    const registration = await this.registrationRepository.findById(id);

    if (!registration) {
      throw new NotFoundException(`Registration with id ${id} not found`);
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new BadRequestException('Registration is already completed');
    }

    const updateData: Partial<Registration> = {
      ...dto.data,
      currentStep: dto.step + 1,
    } as Partial<Registration>;

    // When completing the address step, generate and send MFA
    if (dto.step === RegistrationStep.ADDRESS) {
      const mfaExpirationMinutes = parseInt(
        process.env.MFA_EXPIRATION_MINUTES ?? '5',
        10,
      );
      const mfaCode = generateMfaCode();
      const mfaExpiresAt = new Date(
        Date.now() + mfaExpirationMinutes * 60 * 1000,
      );

      updateData.mfaCode = mfaCode;
      updateData.mfaExpiresAt = mfaExpiresAt;
      updateData.status = RegistrationStatus.MFA_SENT;

      const updated = await this.registrationRepository.update(id, updateData);
      await this.emailProvider.sendMfaCode(registration.email, mfaCode);
      return updated;
    }

    const updated = await this.registrationRepository.update(id, updateData);
    return updated;
  }
}
