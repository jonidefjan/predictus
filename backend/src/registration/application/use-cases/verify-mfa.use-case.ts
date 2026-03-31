import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';
import { VerifyMfaDto } from '../dtos/verify-mfa.dto';

@Injectable()
export class VerifyMfaUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(id: string, dto: VerifyMfaDto): Promise<Registration> {
    const registration = await this.registrationRepository.findById(id);

    if (!registration) {
      throw new NotFoundException(`Registration with id ${id} not found`);
    }

    if (registration.mfaCode !== dto.code) {
      throw new BadRequestException('Invalid MFA code');
    }

    if (!registration.mfaExpiresAt || registration.mfaExpiresAt < new Date()) {
      throw new BadRequestException('MFA code has expired');
    }

    registration.mfaVerifiedAt = new Date();
    registration.status = RegistrationStatus.MFA_VERIFIED;
    registration.mfaCode = null;

    return this.registrationRepository.save(registration);
  }
}
