import { UpdateRegistrationStepUseCase } from '../update-registration-step.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { UpdateStepDto } from '../../dtos/update-step.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockRegistration } from './helpers/mock-registration.factory';

describe('UpdateRegistrationStepUseCase', () => {
  let useCase: UpdateRegistrationStepUseCase;
  let mockRepo: jest.Mocked<IRegistrationRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findAbandoned: jest.fn(),
    };

    useCase = new UpdateRegistrationStepUseCase(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('Happy Path', () => {
      it('should update registration with provided step data (partial update)', async () => {
        const dto: UpdateStepDto = { step: 2, data: { name: 'John', cpf: '123' } };
        const existing = createMockRegistration({ status: RegistrationStatus.MFA_SENT });
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

      it('should update currentStep to the provided step number', async () => {
        const dto: UpdateStepDto = { step: 3, data: { cep: '01001000' } };
        const existing = createMockRegistration({ status: RegistrationStatus.MFA_VERIFIED });
        const updated = createMockRegistration({ currentStep: 3, cep: '01001000' });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', expect.objectContaining({ currentStep: 3 }));
        expect(result.currentStep).toBe(3);
      });

      it('should save the updated registration via repository', async () => {
        const dto: UpdateStepDto = { step: 1, data: { name: 'Jane' } };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ name: 'Jane' });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledTimes(1);
      });

      it('should return the updated registration', async () => {
        const dto: UpdateStepDto = { step: 1, data: { name: 'Jane' } };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ name: 'Jane' });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(result).toEqual(updated);
      });

      it('should handle step 1 data (personal: name, cpf, phone, birthDate)', async () => {
        const step1Data = {
          name: 'Maria Silva',
          cpf: '98765432100',
          phone: '11988887777',
          birthDate: new Date('1985-06-15'),
        };
        const dto: UpdateStepDto = { step: 1, data: step1Data };
        const existing = createMockRegistration({ status: RegistrationStatus.MFA_VERIFIED });
        const updated = createMockRegistration({ ...step1Data, currentStep: 1 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', {
          ...step1Data,
          currentStep: 1,
        });
        expect(result.name).toBe('Maria Silva');
        expect(result.cpf).toBe('98765432100');
        expect(result.phone).toBe('11988887777');
      });

      it('should handle step 2 data (address: cep, street, number, complement, neighborhood, city, state)', async () => {
        const step2Data = {
          cep: '01310100',
          street: 'Av. Paulista',
          number: '1000',
          complement: 'Apto 42',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
        };
        const dto: UpdateStepDto = { step: 2, data: step2Data };
        const existing = createMockRegistration({ status: RegistrationStatus.MFA_VERIFIED });
        const updated = createMockRegistration({ ...step2Data, currentStep: 2 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', {
          ...step2Data,
          currentStep: 2,
        });
        expect(result.street).toBe('Av. Paulista');
        expect(result.city).toBe('São Paulo');
      });

      it('should only update the fields provided (incremental persistence)', async () => {
        const dto: UpdateStepDto = { step: 1, data: { name: 'Only Name' } };
        const existing = createMockRegistration({ status: RegistrationStatus.PENDING });
        const updated = createMockRegistration({ name: 'Only Name', currentStep: 1 });

        mockRepo.findById.mockResolvedValue(existing);
        mockRepo.update.mockResolvedValue(updated);

        await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.update).toHaveBeenCalledWith('test-uuid-123', {
          name: 'Only Name',
          currentStep: 1,
        });
        // Should NOT include unrelated fields in the update call
        const callArg = mockRepo.update.mock.calls[0][1];
        expect(callArg).not.toHaveProperty('email');
        expect(callArg).not.toHaveProperty('cpf');
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
