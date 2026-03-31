import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';
import { UpdateStepDto } from '../dtos/update-step.dto';

@Injectable()
export class UpdateRegistrationStepUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(id: string, dto: UpdateStepDto): Promise<Registration> {
    const registration = await this.registrationRepository.findById(id);

    if (!registration) {
      throw new NotFoundException(`Registration with id ${id} not found`);
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new BadRequestException('Registration is already completed');
    }

    const updated = await this.registrationRepository.update(id, {
      ...dto.data,
      currentStep: dto.step,
    });

    return updated;
  }
}
