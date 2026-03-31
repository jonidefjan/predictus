import { UpdateRegistrationStepUseCase } from '../update-registration-step.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { IEmailProvider } from '../../../domain/interfaces/email-provider.interface';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { UpdateStepDto } from '../../dtos/update-step.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockRegistration } from './helpers/mock-registration.factory';

describe('UpdateRegistrationStepUseCase', () => {
  let useCase: UpdateRegistrationStepUseCase;
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

    useCase = new UpdateRegistrationStepUseCase(mockRepo, mockEmailProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.MFA_EXPIRATION_MINUTES;
  });

  describe('execute', () => {
    describe('Happy Path', () => {
      it('should update registration with provided step data and advance currentStep', async () => {
        const dto: UpdateStepDto = { step: 1, data: { name: 'John', cpf: '123' } };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ currentStep: 2, name: 'John', cpf: '123' });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', {
          name: 'John',
          cpf: '123',
          currentStep: 2,
        });
        expect(result).toBe(updated);
      });

      it('should set currentStep to step + 1', async () => {
        const dto: UpdateStepDto = { step: 1, data: { name: 'Jane' } };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ name: 'Jane', currentStep: 2 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', expect.objectContaining({ currentStep: 2 }));
      });

      it('should handle step 1 data (personal: name, cpf, phone, birthDate)', async () => {
        const step1Data = {
          name: 'Maria Silva',
          cpf: '98765432100',
          phone: '11988887777',
          birthDate: new Date('1985-06-15'),
        };
        const dto: UpdateStepDto = { step: 1, data: step1Data };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ ...step1Data, currentStep: 2 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', {
          ...step1Data,
          currentStep: 2,
        });
        expect(result.name).toBe('Maria Silva');
      });

      it('should not send MFA email for step 1', async () => {
        const dto: UpdateStepDto = { step: 1, data: { name: 'Jane' } };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ name: 'Jane', currentStep: 2 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        await useCase.execute('test-uuid-123', dto);

        expect(mockEmailProvider.sendMfaCode).not.toHaveBeenCalled();
      });
    });

    describe('Step 2 — Address with MFA', () => {
      const step2Data = {
        cep: '01310100',
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Apto 42',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      };

      it('should save address data and advance to step 3', async () => {
        const dto: UpdateStepDto = { step: 2, data: step2Data };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ ...step2Data, currentStep: 3 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', expect.objectContaining({
          ...step2Data,
          currentStep: 3,
          status: RegistrationStatus.MFA_SENT,
        }));
        expect(result.street).toBe('Av. Paulista');
      });

      it('should generate MFA code and send email when completing step 2', async () => {
        const dto: UpdateStepDto = { step: 2, data: step2Data };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ ...step2Data, currentStep: 3 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        await useCase.execute('test-uuid-123', dto);

        expect(mockEmailProvider.sendMfaCode).toHaveBeenCalledTimes(1);
        expect(mockEmailProvider.sendMfaCode).toHaveBeenCalledWith(
          existing.email,
          expect.stringMatching(/^\d{6}$/),
        );
      });

      it('should set status to MFA_SENT when completing step 2', async () => {
        const dto: UpdateStepDto = { step: 2, data: step2Data };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ ...step2Data, currentStep: 3, status: RegistrationStatus.MFA_SENT });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        await useCase.execute('test-uuid-123', dto);

        const updateArg = mockRepo.update.mock.calls[0][1];
        expect(updateArg).toHaveProperty('status', RegistrationStatus.MFA_SENT);
        expect(updateArg).toHaveProperty('mfaCode');
        expect(updateArg).toHaveProperty('mfaExpiresAt');
      });

      it('should use MFA_EXPIRATION_MINUTES env var for expiration', async () => {
        process.env.MFA_EXPIRATION_MINUTES = '10';
        const dto: UpdateStepDto = { step: 2, data: step2Data };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ ...step2Data, currentStep: 3 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const before = Date.now();
        await useCase.execute('test-uuid-123', dto);
        const after = Date.now();

        const updateArg = mockRepo.update.mock.calls[0][1];
        const expiresAt = (updateArg as { mfaExpiresAt: Date }).mfaExpiresAt.getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(before + 10 * 60 * 1000);
        expect(expiresAt).toBeLessThanOrEqual(after + 10 * 60 * 1000);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundException when registration ID does not exist', async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(
          useCase.execute('uuid-nonexistent', { step: 2, data: {} }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException when registration status is COMPLETED', async () => {
        const completed = createMockRegistration({ status: RegistrationStatus.COMPLETED });
        mockRepo.findById.mockResolvedValue(completed);

        await expect(
          useCase.execute('test-uuid-123', { step: 2, data: {} }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException with correct message when already completed', async () => {
        const completed = createMockRegistration({ status: RegistrationStatus.COMPLETED });
        mockRepo.findById.mockResolvedValue(completed);

        await expect(
          useCase.execute('test-uuid-123', { step: 2, data: {} }),
        ).rejects.toThrow('Registration is already completed');
      });
    });
  });
});
