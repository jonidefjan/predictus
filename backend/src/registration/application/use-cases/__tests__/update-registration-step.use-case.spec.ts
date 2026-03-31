import { UpdateRegistrationStepUseCase } from '../update-registration-step.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { UpdateStepDto } from '../../dtos/update-step.dto';
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
    status: RegistrationStatus.PENDING,
    currentStep: 1,
    mfaCode: null,
    mfaExpiresAt: null,
    mfaVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Registration);

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
    };

    useCase = new UpdateRegistrationStepUseCase(mockRepo);
  });

  it('should update registration step with provided data', async () => {
    const dto: UpdateStepDto = { step: 2, data: { name: 'John', cpf: '123' } };
    const existing = makeRegistration();
    const updated = makeRegistration({ currentStep: 2, name: 'John', cpf: '123' });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);

    const result = await useCase.execute('uuid-1', dto);

    expect(mockRepo.update).toHaveBeenCalledWith('uuid-1', {
      name: 'John',
      cpf: '123',
      currentStep: 2,
    });
    expect(result.currentStep).toBe(2);
  });

  it('should throw NotFoundException when registration not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('uuid-nonexistent', { step: 2, data: {} }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when registration is already completed', async () => {
    const completed = makeRegistration({ status: RegistrationStatus.COMPLETED });
    mockRepo.findById.mockResolvedValue(completed);

    await expect(
      useCase.execute('uuid-1', { step: 2, data: {} }),
    ).rejects.toThrow(BadRequestException);
  });
});
