import { VerifyMfaUseCase } from '../verify-mfa.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { VerifyMfaDto } from '../../dtos/verify-mfa.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const makeRegistration = (overrides: Partial<Registration> = {}): Registration =>
  ({
    id: 'uuid-1',
    email: 'test@example.com',
    name: null,
    cpf: null,
    phone: null,
    birthDate: null,
    cep: null,
    street: null,
    number: null,
    complement: null,
    neighborhood: null,
    city: null,
    state: null,
    password: null,
    status: RegistrationStatus.MFA_SENT,
    currentStep: 3,
    mfaCode: '123456',
    mfaExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    mfaVerifiedAt: null,
    abandonmentEmailSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Registration);

describe('VerifyMfaUseCase', () => {
  let useCase: VerifyMfaUseCase;
  let mockRepo: jest.Mocked<IRegistrationRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findAbandoned: jest.fn(),
    };

    useCase = new VerifyMfaUseCase(mockRepo);
  });

  it('should verify MFA code and update status', async () => {
    const dto: VerifyMfaDto = { code: '123456' };
    const registration = makeRegistration();
    const saved = makeRegistration({
      status: RegistrationStatus.MFA_VERIFIED,
      mfaCode: null,
      mfaVerifiedAt: new Date(),
    });

    mockRepo.findById.mockResolvedValue(registration);
    mockRepo.save.mockResolvedValue(saved);

    const result = await useCase.execute('uuid-1', dto);

    expect(mockRepo.save).toHaveBeenCalled();
    const callArg = mockRepo.save.mock.calls[0][0];
    expect(callArg.mfaCode).toBeNull();
    expect(callArg.status).toBe(RegistrationStatus.MFA_VERIFIED);
    expect(callArg.mfaVerifiedAt).not.toBeNull();
    expect(result.status).toBe(RegistrationStatus.MFA_VERIFIED);
  });

  it('should throw NotFoundException when registration not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('uuid-nonexistent', { code: '123456' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when MFA code has not been sent (null)', async () => {
    const registration = makeRegistration({ mfaCode: null });
    mockRepo.findById.mockResolvedValue(registration);

    await expect(
      useCase.execute('uuid-1', { code: '123456' }),
    ).rejects.toThrow(new BadRequestException('MFA code not sent yet'));
  });

  it('should throw BadRequestException when MFA code is expired', async () => {
    const registration = makeRegistration({
      mfaCode: '123456',
      mfaExpiresAt: new Date(Date.now() - 1000),
    });
    mockRepo.findById.mockResolvedValue(registration);

    await expect(
      useCase.execute('uuid-1', { code: '123456' }),
    ).rejects.toThrow(new BadRequestException('MFA code has expired. Please request a new code.'));
  });

  it('should throw BadRequestException when MFA code is invalid', async () => {
    const registration = makeRegistration({ mfaCode: '123456' });
    mockRepo.findById.mockResolvedValue(registration);

    await expect(
      useCase.execute('uuid-1', { code: '999999' }),
    ).rejects.toThrow(new BadRequestException('Invalid MFA code'));
  });

  it('should clear mfaCode after successful verification', async () => {
    const dto: VerifyMfaDto = { code: '123456' };
    const registration = makeRegistration();
    mockRepo.findById.mockResolvedValue(registration);
    mockRepo.save.mockImplementation(async (reg) => reg);

    await useCase.execute('uuid-1', dto);

    const callArg = mockRepo.save.mock.calls[0][0];
    expect(callArg.mfaCode).toBeNull();
  });
});
