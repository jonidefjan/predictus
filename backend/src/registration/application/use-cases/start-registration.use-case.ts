import { Inject, Injectable } from '@nestjs/common';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';
import { StartRegistrationDto } from '../dtos/start-registration.dto';

@Injectable()
export class StartRegistrationUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(dto: StartRegistrationDto): Promise<Omit<Registration, 'mfaCode' | 'password'>> {
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

    const { mfaCode: _mfaCode, password: _password, ...result } = registration;
    return result as Omit<Registration, 'mfaCode' | 'password'>;
  }
}
