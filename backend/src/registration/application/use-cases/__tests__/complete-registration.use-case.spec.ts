import { CompleteRegistrationUseCase } from '../complete-registration.use-case';
import { IRegistrationRepository } from '../../../domain/interfaces/registration-repository.interface';
import { RegistrationStatus } from '../../../domain/enums/registration-status.enum';
import { CompleteRegistrationDto } from '../../dtos/complete-registration.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockRegistration } from './helpers/mock-registration.factory';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

import * as bcrypt from 'bcrypt';

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
      findAbandoned: jest.fn(),
    };

    useCase = new CompleteRegistrationUseCase(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('Happy Path', () => {
      it('should complete registration when all fields are filled and MFA is verified', async () => {
        const dto: CompleteRegistrationDto = { password: 'SecurePass123' };
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          password: null,
        });
        const saved = createMockRegistration({
          status: RegistrationStatus.COMPLETED,
          password: 'hashed_password',
          mfaVerifiedAt: new Date(),
        });

        mockRepo.findById.mockResolvedValue(registration);
        mockRepo.save.mockResolvedValue(saved);

        const result = await useCase.execute('test-uuid-123', dto);

        expect(result.status).toBe(RegistrationStatus.COMPLETED);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
      });

      it('should hash the password with bcrypt before saving', async () => {
        const dto: CompleteRegistrationDto = { password: 'SecurePass123' };
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          password: null,
        });
        mockRepo.findById.mockResolvedValue(registration);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute('test-uuid-123', dto);

        expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123', 10);
      });

      it('should set status to COMPLETED', async () => {
        const dto: CompleteRegistrationDto = { password: 'SecurePass123' };
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          password: null,
        });
        mockRepo.findById.mockResolvedValue(registration);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute('test-uuid-123', dto);

        const savedArg = mockRepo.save.mock.calls[0][0];
        expect(savedArg.status).toBe(RegistrationStatus.COMPLETED);
      });

      it('should save the registration via repository', async () => {
        const dto: CompleteRegistrationDto = { password: 'SecurePass123' };
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          password: null,
        });
        mockRepo.findById.mockResolvedValue(registration);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute('test-uuid-123', dto);

        expect(mockRepo.save).toHaveBeenCalledTimes(1);
      });

      it('should NOT store plaintext password', async () => {
        const dto: CompleteRegistrationDto = { password: 'PlainTextPassword' };
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          password: null,
        });
        mockRepo.findById.mockResolvedValue(registration);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute('test-uuid-123', dto);

        const savedArg = mockRepo.save.mock.calls[0][0];
        expect(savedArg.password).not.toBe('PlainTextPassword');
        expect(savedArg.password).toBe('hashed_password');
      });
    });

    describe('Security Validations', () => {
      it('should throw BadRequestException when MFA is not verified (mfaVerifiedAt is null)', async () => {
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: null,
        });
        mockRepo.findById.mockResolvedValue(registration);

        await expect(
          useCase.execute('test-uuid-123', { password: 'Password123' }),
        ).rejects.toThrow(new BadRequestException('MFA verification required before completing registration'));
      });

      it('should throw BadRequestException when status is not MFA_VERIFIED', async () => {
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_SENT,
          mfaVerifiedAt: new Date(),
        });
        mockRepo.findById.mockResolvedValue(registration);

        await expect(
          useCase.execute('test-uuid-123', { password: 'Password123' }),
        ).rejects.toThrow(new BadRequestException('Invalid registration status for completion'));
      });

      it('should throw NotFoundException when registration ID does not exist', async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(
          useCase.execute('uuid-nonexistent', { password: 'Password123' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('Field Validation', () => {
      const requiredFields: Array<{ field: string; value: null }> = [
        { field: 'name', value: null },
        { field: 'email', value: null },
        { field: 'cpf', value: null },
        { field: 'phone', value: null },
        { field: 'birthDate', value: null },
        { field: 'cep', value: null },
        { field: 'street', value: null },
        { field: 'number', value: null },
        { field: 'neighborhood', value: null },
        { field: 'city', value: null },
        { field: 'state', value: null },
      ];

      requiredFields.forEach(({ field }) => {
        it(`should throw BadRequestException when ${field} is missing`, async () => {
          const registration = createMockRegistration({
            status: RegistrationStatus.MFA_VERIFIED,
            mfaVerifiedAt: new Date(),
            [field]: null,
          });
          mockRepo.findById.mockResolvedValue(registration);

          await expect(
            useCase.execute('test-uuid-123', { password: 'Password123' }),
          ).rejects.toThrow(BadRequestException);
        });
      });

      it('should throw BadRequestException with missing fields list when required fields are absent', async () => {
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          name: null,
          cpf: null,
        });
        mockRepo.findById.mockResolvedValue(registration);

        await expect(
          useCase.execute('test-uuid-123', { password: 'Password123' }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('Password Handling', () => {
      it('should call bcrypt.hash with correct salt rounds (10)', async () => {
        const dto: CompleteRegistrationDto = { password: 'MyPassword123' };
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          password: null,
        });
        mockRepo.findById.mockResolvedValue(registration);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute('test-uuid-123', dto);

        expect(bcrypt.hash).toHaveBeenCalledWith('MyPassword123', 10);
      });

      it('should store the hashed password returned by bcrypt', async () => {
        const dto: CompleteRegistrationDto = { password: 'MyPassword123' };
        const registration = createMockRegistration({
          status: RegistrationStatus.MFA_VERIFIED,
          mfaVerifiedAt: new Date(),
          password: null,
        });
        mockRepo.findById.mockResolvedValue(registration);
        mockRepo.save.mockImplementation(async (reg) => reg);

        await useCase.execute('test-uuid-123', dto);

        const savedArg = mockRepo.save.mock.calls[0][0];
        expect(savedArg.password).toBe('hashed_password');
      });
    });
  });
});
