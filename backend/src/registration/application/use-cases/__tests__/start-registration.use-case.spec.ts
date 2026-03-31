import { StartRegistrationUseCase } from '../start-registration.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { IEmailProvider } from '../../../domain/interfaces/email-provider.interface';
import { Registration } from '../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { StartRegistrationDto } from '../../dtos/start-registration.dto';
import { createMockRegistration } from './helpers/mock-registration.factory';

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
      findAbandoned: jest.fn(),
    };

    mockEmailProvider = {
      sendMfaCode: jest.fn().mockResolvedValue(undefined),
      sendAbandonmentReminder: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new StartRegistrationUseCase(mockRepo, mockEmailProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.MFA_EXPIRATION_MINUTES;
  });

  describe('execute', () => {
    describe('Happy Path — new registration', () => {
      it('should create a new registration when no existing registration with the email exists', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        const saved = createMockRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: '123456' });

        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockResolvedValue(saved);

        await useCase.execute(dto);

        expect(mockRepo.create).toHaveBeenCalledWith({
          email: dto.email,
          status: RegistrationStatus.PENDING,
          currentStep: 1,
        });
      });

      it('should generate a 6-digit MFA code', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        const savedArg: Registration = mockRepo.save.mock.calls[0][0];
        expect(savedArg.mfaCode).toMatch(/^\d{6}$/);
      });

      it('should set status to MFA_SENT', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        const savedArg: Registration = mockRepo.save.mock.calls[0][0];
        expect(savedArg.status).toBe(RegistrationStatus.MFA_SENT);
      });

      it('should set mfaExpiresAt using default 5 minutes when MFA_EXPIRATION_MINUTES is not set', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockImplementation(async (reg) => reg);

        const before = Date.now();
        await useCase.execute(dto);
        const after = Date.now();

        const savedArg: Registration = mockRepo.save.mock.calls[0][0];
        const expiresAt = savedArg.mfaExpiresAt!.getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(before + 5 * 60 * 1000);
        expect(expiresAt).toBeLessThanOrEqual(after + 5 * 60 * 1000);
      });

      it('should set mfaExpiresAt based on MFA_EXPIRATION_MINUTES env var', async () => {
        process.env.MFA_EXPIRATION_MINUTES = '10';
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockImplementation(async (reg) => reg);

        const before = Date.now();
        await useCase.execute(dto);
        const after = Date.now();

        const savedArg: Registration = mockRepo.save.mock.calls[0][0];
        const expiresAt = savedArg.mfaExpiresAt!.getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(before + 10 * 60 * 1000);
        expect(expiresAt).toBeLessThanOrEqual(after + 10 * 60 * 1000);
      });

      it('should call emailProvider.sendMfaCode with the correct email and code', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        const savedArg: Registration = mockRepo.save.mock.calls[0][0];
        expect(mockEmailProvider.sendMfaCode).toHaveBeenCalledWith(
          'test@example.com',
          savedArg.mfaCode,
        );
      });

      it('should save the registration via repository', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        const saved = createMockRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: '123456' });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockResolvedValue(saved);

        await useCase.execute(dto);

        expect(mockRepo.save).toHaveBeenCalledTimes(1);
      });

      it('should return the registration without exposing mfaCode or password', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        const saved = createMockRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: '123456' });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockResolvedValue(saved);

        const result = await useCase.execute(dto);

        expect(result).not.toHaveProperty('mfaCode');
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('Resume Flow', () => {
      it('should reuse existing registration if status is PENDING', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(existing);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        expect(mockRepo.create).not.toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalled();
      });

      it('should reuse existing registration if status is MFA_SENT', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.MFA_SENT, mfaCode: 'old_code' });
        mockRepo.findByEmail.mockResolvedValue(existing);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        expect(mockRepo.create).not.toHaveBeenCalled();
      });

      it('should generate a NEW MFA code when resuming', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: '111111' });
        mockRepo.findByEmail.mockResolvedValue(existing);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        const savedArg: Registration = mockRepo.save.mock.calls[0][0];
        expect(savedArg.mfaCode).toMatch(/^\d{6}$/);
      });

      it('should resend the MFA email when resuming', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(existing);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        expect(mockEmailProvider.sendMfaCode).toHaveBeenCalledTimes(1);
      });

      it('should create a new registration when existing status is COMPLETED', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const existing = createMockRegistration({ status: RegistrationStatus.COMPLETED });
        const created = createMockRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(existing);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute(dto);

        expect(mockRepo.create).toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      it('should propagate email provider failure', async () => {
        const dto: StartRegistrationDto = { email: 'test@example.com' };
        const created = createMockRegistration({ mfaCode: null });
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(created);
        mockRepo.save.mockImplementation(async (reg) => reg);
        mockEmailProvider.sendMfaCode.mockRejectedValue(new Error('Email service unavailable'));

        await expect(useCase.execute(dto)).rejects.toThrow('Email service unavailable');
      });
    });
  });
});
