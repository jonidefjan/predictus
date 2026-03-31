import { StartRegistrationUseCase } from '../start-registration.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { StartRegistrationDto } from '../../dtos/start-registration.dto';
import { createMockRegistration } from './helpers/mock-registration.factory';

describe('StartRegistrationUseCase', () => {
  let useCase: StartRegistrationUseCase;
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

    useCase = new StartRegistrationUseCase(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('Happy Path — new registration', () => {
      it('should create a new registration when no existing registration with the email exists', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });

        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);

        await useCase.execute(dto);

        expect(mockRepo.create).toHaveBeenCalledWith({
          email: dto.email,
          status: RegistrationStatus.PENDING,
          currentStep: 1,
        });
      });

      it('should return the registration without exposing mfaCode or password', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);

        const result = await useCase.execute(dto);

        expect(result).not.toHaveProperty('mfaCode');
        expect(result).not.toHaveProperty('password');
      });

      it('should not send MFA email at start', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);

        await useCase.execute(dto);

        expect(mockRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('Resume Flow', () => {
      it('should reuse existing registration if status is PENDING', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(existing);

        await useCase.execute(dto);

        expect(mockRepo.create).not.toHaveBeenCalled();
      });

      it('should reuse existing registration if status is MFA_SENT', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: 'old_code' });
        mockRepo.findByEmail.mockResolvedValue(existing);

        await useCase.execute(dto);

        expect(mockRepo.create).not.toHaveBeenCalled();
      });

      it('should create a new registration when existing status is COMPLETED', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.COMPLETED });
        const created = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(existing);
        mockRepo.create.mockResolvedValue(created);

        await useCase.execute(dto);

        expect(mockRepo.create).toHaveBeenCalled();
      });
    });
  });
});
