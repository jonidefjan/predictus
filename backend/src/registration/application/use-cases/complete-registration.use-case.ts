import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';
import { CompleteRegistrationDto } from '../dtos/complete-registration.dto';

const REQUIRED_FIELDS: (keyof Registration)[] = [
  'name',
  'email',
  'cpf',
  'phone',
  'birthDate',
  'cep',
  'street',
  'number',
  'neighborhood',
  'city',
  'state',
];

@Injectable()
export class CompleteRegistrationUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(id: string, dto: CompleteRegistrationDto): Promise<Registration> {
    const registration = await this.registrationRepository.findById(id);

    if (!registration) {
      throw new NotFoundException(`Registration with id ${id} not found`);
    }

    if (!registration.mfaVerifiedAt) {
      throw new BadRequestException('MFA verification required before completing registration');
    }

    if (registration.status !== RegistrationStatus.MFA_VERIFIED) {
      throw new BadRequestException('Invalid registration status for completion');
    }

    const missingFields = REQUIRED_FIELDS.filter(
      (field) => !registration[field],
    );

    if (missingFields.length > 0) {
      throw new BadRequestException({
        message: 'Missing required fields',
        fields: missingFields,
      });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
    const pepper = process.env.PASSWORD_PEPPER ?? '';
    const pepperedPassword = createHmac('sha256', pepper)
      .update(dto.password)
      .digest('hex');
    const hashedPassword = await bcrypt.hash(pepperedPassword, saltRounds);

    registration.password = hashedPassword;
    registration.status = RegistrationStatus.COMPLETED;

    return this.registrationRepository.save(registration);
  }
}
