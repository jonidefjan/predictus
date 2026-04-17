import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { Registration } from './domain/entities/registration.entity';
import { RegistrationStatus } from './domain/enums/registration-status.enum';
import { RegistrationStep } from './domain/enums/registration-step.enum';
import { ResendEmailProvider } from './infrastructure/providers/resend-email.provider';
import { generateMfaCode } from '../shared/utils/mfa-code.generator';
import { StartRegistrationDto } from './application/dtos/start-registration.dto';
import { UpdateStepDto } from './application/dtos/update-step.dto';
import { VerifyMfaDto } from './application/dtos/verify-mfa.dto';
import { CompleteRegistrationDto } from './application/dtos/complete-registration.dto';
import { RegistrationProfileDto } from './application/dtos/registration-profile.dto';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  private validateRegistrationProfile(registration: Registration): void {
    const profile = plainToInstance(RegistrationProfileDto, registration);
    const errors = validateSync(profile);

    if (errors.length > 0) {
      const fields = errors
        .map((error) => error.property)
        .filter((property) => property.length > 0);

      throw new BadRequestException({
        message: 'Missing required fields',
        fields,
      });
    }
  }

  constructor(
    @InjectRepository(Registration)
    private readonly repo: Repository<Registration>,
    private readonly emailProvider: ResendEmailProvider,
  ) {}

  async startRegistration(dto: StartRegistrationDto): Promise<Omit<Registration, 'mfaCode' | 'password'>> {
    let registration = await this.repo.findOne({ where: { email: dto.email } });

    if (
      !registration ||
      (registration.status !== RegistrationStatus.PENDING &&
        registration.status !== RegistrationStatus.MFA_SENT)
    ) {
      registration = await this.repo.create({
        email: dto.email,
        status: RegistrationStatus.PENDING,
        currentStep: 1,
      });
      registration = await this.repo.save(registration);
    }

    const { mfaCode: _m, password: _p, ...result } = registration;
    return result as Omit<Registration, 'mfaCode' | 'password'>;
  }

  async updateStep(id: string, dto: UpdateStepDto): Promise<Registration> {
    const registration = await this.repo.findOne({ where: { id } });
    if (!registration) throw new NotFoundException(`Registration with id ${id} not found`);
    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new BadRequestException('Registration is already completed');
    }

    Object.assign(registration, dto.data, { currentStep: dto.step + 1 } as Partial<Registration>);

    if (dto.step === RegistrationStep.ADDRESS) {
      const expirationMinutes = parseInt(process.env.MFA_EXPIRATION_MINUTES ?? '5', 10);
      const mfaCode = generateMfaCode();
      registration.mfaCode = mfaCode;
      registration.mfaExpiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
      registration.status = RegistrationStatus.MFA_SENT;

      const updated = await this.repo.save(registration);
      await this.emailProvider.sendMfaCode(registration.email, mfaCode);
      return updated;
    }

    return this.repo.save(registration);
  }

  async verifyMfa(id: string, dto: VerifyMfaDto): Promise<Registration> {
    const registration = await this.repo.findOne({ where: { id } });
    if (!registration) throw new NotFoundException(`Registration with id ${id} not found`);

    if (registration.mfaCode === null) throw new BadRequestException('MFA code not sent yet');
    if (!registration.mfaExpiresAt || registration.mfaExpiresAt < new Date()) {
      throw new BadRequestException('MFA code has expired. Please request a new code.');
    }
    if (registration.mfaCode !== dto.code) throw new BadRequestException('Invalid MFA code');

    registration.mfaCode = null;
    registration.mfaVerifiedAt = new Date();
    registration.status = RegistrationStatus.MFA_VERIFIED;
    return this.repo.save(registration);
  }

  async resendMfa(id: string): Promise<Omit<Registration, 'mfaCode' | 'password'>> {
    const registration = await this.repo.findOne({ where: { id } });
    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new BadRequestException('Registration is already completed');
    }

    const expirationMinutes = parseInt(process.env.MFA_EXPIRATION_MINUTES ?? '5', 10);
    const mfaCode = generateMfaCode();
    registration.mfaCode = mfaCode;
    registration.mfaExpiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    registration.mfaVerifiedAt = null;
    registration.status = RegistrationStatus.MFA_SENT;

    await this.repo.save(registration);
    await this.emailProvider.sendMfaCode(registration.email, mfaCode);

    const { mfaCode: _m, password: _p, ...result } = registration;
    return result as Omit<Registration, 'mfaCode' | 'password'>;
  }

  async completeRegistration(id: string, dto: CompleteRegistrationDto): Promise<Registration> {
    const registration = await this.repo.findOne({ where: { id } });
    if (!registration) throw new NotFoundException(`Registration with id ${id} not found`);
    if (!registration.mfaVerifiedAt) {
      throw new BadRequestException('MFA verification required before completing registration');
    }
    if (registration.status !== RegistrationStatus.MFA_VERIFIED) {
      throw new BadRequestException('Invalid registration status for completion');
    }

    this.validateRegistrationProfile(registration);

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
    const pepper = process.env.PASSWORD_PEPPER ?? '';
    const pepperedPassword = createHmac('sha256', pepper).update(dto.password).digest('hex');
    registration.password = await bcrypt.hash(pepperedPassword, saltRounds);
    registration.status = RegistrationStatus.COMPLETED;
    return this.repo.save(registration);
  }

  async findAll(): Promise<Omit<Registration, 'mfaCode' | 'password'>[]> {
    const registrations = await this.repo.find({ order: { updatedAt: 'DESC' } });
    return registrations.map(({ mfaCode: _m, password: _p, ...rest }) => rest);
  }

  async findById(id: string): Promise<Omit<Registration, 'mfaCode' | 'password'>> {
    const registration = await this.repo.findOne({ where: { id } });
    if (!registration) throw new NotFoundException('Registration not found');
    const { mfaCode: _m, password: _p, ...result } = registration;
    return result as Omit<Registration, 'mfaCode' | 'password'>;
  }

  async processAbandoned(): Promise<{ processed: number; errors: number }> {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    const abandoned = await this.repo.find({
      where: {
        status: In([RegistrationStatus.PENDING, RegistrationStatus.MFA_SENT]),
        updatedAt: LessThan(threshold),
        abandonmentEmailSentAt: IsNull(),
      },
      take: 50,
      order: { updatedAt: 'ASC' },
    });

    let processed = 0;
    let errors = 0;

    for (const registration of abandoned) {
      try {
        await this.emailProvider.sendAbandonmentReminder(registration.email, registration.id);
        registration.abandonmentEmailSentAt = new Date();
        await this.repo.save(registration);
        processed++;
      } catch (err) {
        this.logger.error(`Failed to process abandoned registration ${registration.id}`, err);
        errors++;
      }
    }

    return { processed, errors };
  }
}
