import { CompleteRegistrationUseCase } from '../complete-registration.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { CompleteRegistrationDto } from '../../dtos/complete-registration.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const makeFullRegistration = (overrides: Partial<Registration> = {}): Registration =>
  ({
    id: 'uuid-1',
    email: 'test@example.com',
    name: 'John Doe',
    cpf: '123.456.789-00',
    phone: '11999999999',
    birthDate: new Date('1990-01-01'),
    cep: '01310-100',
    street: 'Av. Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    password: null,
    status: RegistrationStatus.MFA_VERIFIED,
    currentStep: 4,
    mfaCode: null,
    mfaExpiresAt: null,
    mfaVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Registration);

describe('CompleteRegistrationUseCase', () => {
  let useCase: CompleteRegistrationUseCase;
  let mockRepo: jest.Mocked<IRegistrationRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    useCase = new CompleteRegistrationUseCase(mockRepo);
  });

  it('should complete registration with all required fields', async () => {
    const dto: CompleteRegistrationDto = { password: 'SecurePass123' };
    const registration = makeFullRegistration();
    const saved = makeFullRegistration({
      status: RegistrationStatus.COMPLETED,
      password: 'hashed_password',
    });

    mockRepo.findById.mockResolvedValue(registration);
    mockRepo.save.mockResolvedValue(saved);

    const result = await useCase.execute('uuid-1', dto);

    expect(result.status).toBe(RegistrationStatus.COMPLETED);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException when registration not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('uuid-nonexistent', { password: 'Password123' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when MFA not verified', async () => {
    const registration = makeFullRegistration({ mfaVerifiedAt: null });
    mockRepo.findById.mockResolvedValue(registration);

    await expect(
      useCase.execute('uuid-1', { password: 'Password123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when required fields are missing', async () => {
    const registration = makeFullRegistration({ name: null });
    mockRepo.findById.mockResolvedValue(registration);

    await expect(
      useCase.execute('uuid-1', { password: 'Password123' }),
    ).rejects.toThrow(BadRequestException);
  });
});
