import { ProcessAbandonedRegistrationsUseCase } from '../process-abandoned-registrations.use-case';
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
    status: RegistrationStatus.PENDING,
    currentStep: 1,
    mfaCode: null,
    mfaExpiresAt: null,
    mfaVerifiedAt: null,
    abandonmentEmailSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    ...overrides,
  } as Registration);

describe('ProcessAbandonedRegistrationsUseCase', () => {
  let useCase: ProcessAbandonedRegistrationsUseCase;
  let mockRepo: jest.Mocked<IRegistrationRepository>;
  let mockEmailProvider: jest.Mocked<IEmailProvider>;

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

    mockEmailProvider = {
      sendMfaCode: jest.fn().mockResolvedValue(undefined),
      sendAbandonmentReminder: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ProcessAbandonedRegistrationsUseCase(mockRepo, mockEmailProvider);
  });

  it('should find and send emails to abandoned registrations', async () => {
    const registrations = [
      makeRegistration({ id: 'uuid-1', email: 'a@example.com' }),
      makeRegistration({ id: 'uuid-2', email: 'b@example.com' }),
    ];
    mockRepo.findAbandoned.mockResolvedValue(registrations);
    mockRepo.save.mockImplementation(async (reg) => reg);

    const result = await useCase.execute();

    expect(mockEmailProvider.sendAbandonmentReminder).toHaveBeenCalledTimes(2);
    expect(mockEmailProvider.sendAbandonmentReminder).toHaveBeenCalledWith('a@example.com', 'uuid-1');
    expect(mockEmailProvider.sendAbandonmentReminder).toHaveBeenCalledWith('b@example.com', 'uuid-2');
    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
  });

  it('should update abandonmentEmailSentAt timestamp after sending', async () => {
    const registration = makeRegistration();
    mockRepo.findAbandoned.mockResolvedValue([registration]);
    mockRepo.save.mockImplementation(async (reg) => reg);

    await useCase.execute();

    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved.abandonmentEmailSentAt).not.toBeNull();
    expect(saved.abandonmentEmailSentAt).toBeInstanceOf(Date);
  });

  it('should return correct count when all succeed', async () => {
    const registrations = [makeRegistration({ id: 'uuid-1' }), makeRegistration({ id: 'uuid-2' })];
    mockRepo.findAbandoned.mockResolvedValue(registrations);
    mockRepo.save.mockImplementation(async (reg) => reg);

    const result = await useCase.execute();

    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
  });

  it('should continue processing when one email fails and count errors', async () => {
    const registrations = [
      makeRegistration({ id: 'uuid-1', email: 'a@example.com' }),
      makeRegistration({ id: 'uuid-2', email: 'b@example.com' }),
    ];
    mockRepo.findAbandoned.mockResolvedValue(registrations);
    mockRepo.save.mockImplementation(async (reg) => reg);
    mockEmailProvider.sendAbandonmentReminder
      .mockRejectedValueOnce(new Error('send failed'))
      .mockResolvedValueOnce(undefined);

    const result = await useCase.execute();

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(1);
  });

  it('should return zero counts when no abandoned registrations found', async () => {
    mockRepo.findAbandoned.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockEmailProvider.sendAbandonmentReminder).not.toHaveBeenCalled();
  });

  it('should use 30-minute threshold for finding abandoned registrations', async () => {
    mockRepo.findAbandoned.mockResolvedValue([]);

    const before = Date.now();
    await useCase.execute();
    const after = Date.now();

    const callArg: Date = mockRepo.findAbandoned.mock.calls[0][0];
    const thirtyMinutesAgo = before - 30 * 60 * 1000;
    expect(callArg.getTime()).toBeGreaterThanOrEqual(thirtyMinutesAgo - 100);
    expect(callArg.getTime()).toBeLessThanOrEqual(after - 30 * 60 * 1000 + 100);
  });
});
