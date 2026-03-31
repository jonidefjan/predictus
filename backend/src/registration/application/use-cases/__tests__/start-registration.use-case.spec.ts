import { StartRegistrationUseCase } from '../start-registration.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { IEmailProvider } from '../../../domain/interfaces/email-provider.interface';
import { Registration } from '../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { StartRegistrationDto } from '../../dtos/start-registration.dto';

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
    status: RegistrationStatus.PENDING,
    currentStep: 1,
    mfaCode: null,
    mfaExpiresAt: null,
    mfaVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Registration);

describe('StartRegistrationUseCase', () => {
  let useCase: StartRegistrationUseCase;
  let mockRepo: jest.Mocked<IRegistrationRepository>;
  let mockEmailProvider: jest.Mocked<IEmailProvider>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    mockEmailProvider = {
      sendMfaCode: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new StartRegistrationUseCase(mockRepo, mockEmailProvider);
  });

  it('should create a new registration when none exists', async () => {
    const dto: StartRegistrationDto = { email: 'test@example.com' };
    const created = makeRegistration();
    const saved = makeRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: '123456' });

    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(created);
    mockRepo.save.mockResolvedValue(saved);

    const result = await useCase.execute(dto);

    expect(mockRepo.create).toHaveBeenCalledWith({
      email: dto.email,
      status: RegistrationStatus.PENDING,
      currentStep: 1,
    });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockEmailProvider.sendMfaCode).toHaveBeenCalledWith(saved.email, expect.any(String));
    expect(result).not.toHaveProperty('mfaCode');
    expect(result).not.toHaveProperty('password');
  });

  it('should reuse an existing PENDING registration', async () => {
    const dto: StartRegistrationDto = { email: 'test@example.com' };
    const existing = makeRegistration({ status: RegistrationStatus.PENDING });
    const saved = makeRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: '654321' });

    mockRepo.findByEmail.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue(saved);

    await useCase.execute(dto);

    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should reuse an existing MFA_SENT registration', async () => {
    const dto: StartRegistrationDto = { email: 'test@example.com' };
    const existing = makeRegistration({ status: RegistrationStatus.MFA_SENT });
    const saved = makeRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: '111111' });

    mockRepo.findByEmail.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue(saved);

    await useCase.execute(dto);

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should create a new registration when existing is COMPLETED', async () => {
    const dto: StartRegistrationDto = { email: 'test@example.com' };
    const existing = makeRegistration({ status: RegistrationStatus.COMPLETED });
    const created = makeRegistration();
    const saved = makeRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: '222222' });

    mockRepo.findByEmail.mockResolvedValue(existing);
    mockRepo.create.mockResolvedValue(created);
    mockRepo.save.mockResolvedValue(saved);

    await useCase.execute(dto);

    expect(mockRepo.create).toHaveBeenCalled();
  });
});
