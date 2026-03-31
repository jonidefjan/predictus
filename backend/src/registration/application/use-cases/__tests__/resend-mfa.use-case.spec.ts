import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ResendMfaUseCase } from '../resend-mfa.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { IEmailProvider } from '../../../domain/interfaces/email-provider.interface';
import { Registration } from '../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';

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

describe('ResendMfaUseCase', () => {
  let useCase: ResendMfaUseCase;
  let mockRepo: jest.Mocked<IRegistrationRepository>;
  let mockEmailProvider: jest.Mocked<IEmailProvider>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findAbandoned: jest.fn(),
    };

    mockEmailProvider = {
      sendMfaCode: jest.fn().mockResolvedValue(undefined),
      sendAbandonmentReminder: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ResendMfaUseCase(mockRepo, mockEmailProvider);
  });

  it('should generate new MFA code and send email', async () => {
    const registration = makeRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
    mockRepo.findById.mockResolvedValue(registration);
    mockRepo.save.mockImplementation(async (reg) => reg);

    await useCase.execute('uuid-1');

    expect(mockRepo.save).toHaveBeenCalled();
    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved.mfaCode).not.toBeNull();
    expect(saved.mfaExpiresAt).not.toBeNull();
    expect(saved.status).toBe(RegistrationStatus.MFA_SENT);
    expect(mockEmailProvider.sendMfaCode).toHaveBeenCalledWith('test@example.com', saved.mfaCode);
  });

  it('should reset mfaVerifiedAt to null', async () => {
    const registration = makeRegistration({ mfaVerifiedAt: new Date() });
    mockRepo.findById.mockResolvedValue(registration);
    mockRepo.save.mockImplementation(async (reg) => reg);

    await useCase.execute('uuid-1');

    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved.mfaVerifiedAt).toBeNull();
  });

  it('should not include mfaCode or password in returned result', async () => {
    const registration = makeRegistration();
    mockRepo.findById.mockResolvedValue(registration);
    mockRepo.save.mockImplementation(async (reg) => reg);

    const result = await useCase.execute('uuid-1');

    expect((result as any).mfaCode).toBeUndefined();
    expect((result as any).password).toBeUndefined();
  });

  it('should throw NotFoundException when registration not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('uuid-nonexistent')).rejects.toThrow(
      new NotFoundException('Registration not found'),
    );
  });

  it('should throw BadRequestException when registration is already completed', async () => {
    const registration = makeRegistration({ status: RegistrationStatus.COMPLETED });
    mockRepo.findById.mockResolvedValue(registration);

    await expect(useCase.execute('uuid-1')).rejects.toThrow(
      new BadRequestException('Registration is already completed'),
    );
  });
});
