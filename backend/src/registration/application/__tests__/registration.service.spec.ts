import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RegistrationService } from '../../registration.service';
import { ResendEmailProvider } from '../../infrastructure/providers/resend-email.provider';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';
import { StartRegistrationDto } from '../dtos/start-registration.dto';
import { UpdateStepDto } from '../dtos/update-step.dto';
import { VerifyMfaDto } from '../dtos/verify-mfa.dto';
import { CompleteRegistrationDto } from '../dtos/complete-registration.dto';
import { DeepPartial, Repository } from 'typeorm';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('peppered_hex_value'),
    }),
  }),
}));

import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';

function makeRegistration(overrides: Partial<Registration> = {}): Registration {
  const r = new Registration();
  r.id = 'test-uuid-123';
  r.email = 'test@example.com';
  r.name = 'Test User';
  r.cpf = '12345678901';
  r.phone = '11999999999';
  r.birthDate = new Date('1990-01-01');
  r.cep = '01001000';
  r.street = 'Praça da Sé';
  r.number = '100';
  r.complement = '';
  r.neighborhood = 'Sé';
  r.city = 'São Paulo';
  r.state = 'SP';
  r.password = null;
  r.status = RegistrationStatus.PENDING;
  r.currentStep = 1;
  r.mfaCode = '123456';
  r.mfaExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  r.mfaVerifiedAt = null;
  r.abandonmentEmailSentAt = null;
  r.createdAt = new Date();
  r.updatedAt = new Date();
  return Object.assign(r, overrides);
}

function saveRegistrationMock(entity: DeepPartial<Registration>): Promise<Registration> {
  return Promise.resolve(entity as Registration);
}

describe('RegistrationService', () => {
  let service: RegistrationService;
  let mockRepo: jest.Mocked<Repository<Registration>>;
  let mockEmail: jest.Mocked<ResendEmailProvider>;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Registration>>;

    mockEmail = {
      sendMfaCode: jest.fn().mockResolvedValue(undefined),
      sendAbandonmentReminder: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ResendEmailProvider>;

    service = new RegistrationService(mockRepo, mockEmail);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.BCRYPT_SALT_ROUNDS;
    delete process.env.PASSWORD_PEPPER;
    delete process.env.MFA_EXPIRATION_MINUTES;
  });

  // ── startRegistration ──────────────────────────────────────────────────────

  describe('startRegistration', () => {
    it('creates a new registration when no existing is found', async () => {
      const dto: StartRegistrationDto = { email: 'test@example.com' };
      const created = makeRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      await service.startRegistration(dto);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: dto.email,
        status: RegistrationStatus.PENDING,
        currentStep: 1,
      });
    });

    it('reuses existing PENDING registration', async () => {
      const dto: StartRegistrationDto = { email: 'test@example.com' };
      const existing = makeRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
      mockRepo.findOne.mockResolvedValue(existing);

      await service.startRegistration(dto);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('reuses existing MFA_SENT registration', async () => {
      const dto: StartRegistrationDto = { email: 'test@example.com' };
      const existing = makeRegistration({ status: RegistrationStatus.MFA_SENT });
      mockRepo.findOne.mockResolvedValue(existing);

      await service.startRegistration(dto);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new registration when existing is COMPLETED', async () => {
      const dto: StartRegistrationDto = { email: 'test@example.com' };
      const created = makeRegistration({ status: RegistrationStatus.PENDING });
      mockRepo.findOne.mockResolvedValue(makeRegistration({ status: RegistrationStatus.COMPLETED }));
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      await service.startRegistration(dto);

      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('does not expose mfaCode or password', async () => {
      const dto: StartRegistrationDto = { email: 'test@example.com' };
      const created = makeRegistration({ mfaCode: null });
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.startRegistration(dto);

      expect(result).not.toHaveProperty('mfaCode');
      expect(result).not.toHaveProperty('password');
    });
  });

  // ── updateStep ─────────────────────────────────────────────────────────────

  describe('updateStep', () => {
    it('updates step data and advances currentStep', async () => {
      const dto: UpdateStepDto = { step: 1, data: { name: 'John' } };
      mockRepo.findOne.mockResolvedValue(makeRegistration({ status: RegistrationStatus.PENDING }));
      mockRepo.save.mockImplementation(saveRegistrationMock);

      await service.updateStep('test-uuid-123', dto);

      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'John', currentStep: 2 }));
    });

    it('throws NotFoundException when registration not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStep('x', { step: 1, data: {} })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when already COMPLETED', async () => {
      mockRepo.findOne.mockResolvedValue(makeRegistration({ status: RegistrationStatus.COMPLETED }));
      await expect(service.updateStep('x', { step: 1, data: {} })).rejects.toThrow(BadRequestException);
    });

    it('generates and sends MFA when completing address step (step 2)', async () => {
      const dto: UpdateStepDto = { step: 2, data: { cep: '01001000', street: 'Rua A', number: '1', complement: '', neighborhood: 'B', city: 'C', state: 'SP' } };
      mockRepo.findOne.mockResolvedValue(makeRegistration({ status: RegistrationStatus.PENDING }));
      mockRepo.save.mockImplementation(saveRegistrationMock);

      await service.updateStep('test-uuid-123', dto);

      expect(mockEmail.sendMfaCode).toHaveBeenCalledWith('test@example.com', expect.stringMatching(/^\d{6}$/));
      const savedArg = mockRepo.save.mock.calls[0][0] as Record<string, unknown>;
      expect(savedArg.status).toBe(RegistrationStatus.MFA_SENT);
      expect(savedArg.mfaCode).toMatch(/^\d{6}$/);
      expect(savedArg.mfaExpiresAt).toBeInstanceOf(Date);
    });

    it('respects MFA_EXPIRATION_MINUTES env var', async () => {
      process.env.MFA_EXPIRATION_MINUTES = '10';
      const dto: UpdateStepDto = { step: 2, data: {} };
      mockRepo.findOne.mockResolvedValue(makeRegistration({ status: RegistrationStatus.PENDING }));
      mockRepo.save.mockImplementation(saveRegistrationMock);

      const before = Date.now();
      await service.updateStep('test-uuid-123', dto);
      const after = Date.now();

      const savedArg = mockRepo.save.mock.calls[0][0] as { mfaExpiresAt: Date };
      expect(savedArg.mfaExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 10 * 60 * 1000);
      expect(savedArg.mfaExpiresAt.getTime()).toBeLessThanOrEqual(after + 10 * 60 * 1000);
    });

    it('does not send MFA for non-address steps', async () => {
      const dto: UpdateStepDto = { step: 1, data: {} };
      mockRepo.findOne.mockResolvedValue(makeRegistration({ status: RegistrationStatus.PENDING }));
      mockRepo.save.mockImplementation(saveRegistrationMock);

      await service.updateStep('test-uuid-123', dto);

      expect(mockEmail.sendMfaCode).not.toHaveBeenCalled();
    });
  });

  // ── verifyMfa ──────────────────────────────────────────────────────────────

  describe('verifyMfa', () => {
    it('verifies code, clears mfaCode and sets MFA_VERIFIED', async () => {
      const dto: VerifyMfaDto = { code: '123456' };
      const reg = makeRegistration({ mfaCode: '123456', status: RegistrationStatus.MFA_SENT });
      mockRepo.findOne.mockResolvedValue(reg);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      const result = await service.verifyMfa('test-uuid-123', dto);

      expect(result.mfaCode).toBeNull();
      expect(result.status).toBe(RegistrationStatus.MFA_VERIFIED);
      expect(result.mfaVerifiedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyMfa('x', { code: '123456' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when mfaCode is null', async () => {
      mockRepo.findOne.mockResolvedValue(makeRegistration({ mfaCode: null }));
      await expect(service.verifyMfa('x', { code: '123456' })).rejects.toThrow(new BadRequestException('MFA code not sent yet'));
    });

    it('throws BadRequestException when code is expired', async () => {
      const reg = makeRegistration({ mfaCode: '123456', mfaExpiresAt: new Date(Date.now() - 1000) });
      mockRepo.findOne.mockResolvedValue(reg);
      await expect(service.verifyMfa('x', { code: '123456' })).rejects.toThrow(new BadRequestException('MFA code has expired. Please request a new code.'));
    });

    it('throws BadRequestException when code is wrong', async () => {
      mockRepo.findOne.mockResolvedValue(makeRegistration({ mfaCode: '123456' }));
      await expect(service.verifyMfa('x', { code: '000000' })).rejects.toThrow(new BadRequestException('Invalid MFA code'));
    });
  });

  // ── resendMfa ──────────────────────────────────────────────────────────────

  describe('resendMfa', () => {
    it('generates new MFA, saves and sends email', async () => {
      const reg = makeRegistration({ status: RegistrationStatus.PENDING, mfaCode: null });
      mockRepo.findOne.mockResolvedValue(reg);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      await service.resendMfa('test-uuid-123');

      const saved = mockRepo.save.mock.calls[0][0];
      expect(saved.mfaCode).toMatch(/^\d{6}$/);
      expect(saved.mfaVerifiedAt).toBeNull();
      expect(saved.status).toBe(RegistrationStatus.MFA_SENT);
      expect(mockEmail.sendMfaCode).toHaveBeenCalledWith('test@example.com', saved.mfaCode);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.resendMfa('x')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when already COMPLETED', async () => {
      mockRepo.findOne.mockResolvedValue(makeRegistration({ status: RegistrationStatus.COMPLETED }));
      await expect(service.resendMfa('x')).rejects.toThrow(BadRequestException);
    });

    it('does not expose mfaCode or password in result', async () => {
      const reg = makeRegistration({ status: RegistrationStatus.MFA_SENT });
      mockRepo.findOne.mockResolvedValue(reg);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      const result = await service.resendMfa('test-uuid-123');

      expect((result as Record<string, unknown>).mfaCode).toBeUndefined();
      expect((result as Record<string, unknown>).password).toBeUndefined();
    });
  });

  // ── completeRegistration ───────────────────────────────────────────────────

  describe('completeRegistration', () => {
    const dto: CompleteRegistrationDto = { password: 'SecurePass123' };

    it('hashes password and sets COMPLETED', async () => {
      const reg = makeRegistration({ status: RegistrationStatus.MFA_VERIFIED, mfaVerifiedAt: new Date() });
      mockRepo.findOne.mockResolvedValue(reg);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      const result = await service.completeRegistration('test-uuid-123', dto);

      expect(result.status).toBe(RegistrationStatus.COMPLETED);
      expect(result.password).toBe('hashed_password');
    });

    it('applies pepper via HMAC-SHA256 before bcrypt', async () => {
      process.env.PASSWORD_PEPPER = 'my_secret_pepper';
      const reg = makeRegistration({ status: RegistrationStatus.MFA_VERIFIED, mfaVerifiedAt: new Date() });
      mockRepo.findOne.mockResolvedValue(reg);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      await service.completeRegistration('test-uuid-123', dto);

      expect(createHmac).toHaveBeenCalledWith('sha256', 'my_secret_pepper');
      expect(bcrypt.hash).toHaveBeenCalledWith('peppered_hex_value', expect.any(Number));
    });

    it('respects BCRYPT_SALT_ROUNDS env var', async () => {
      process.env.BCRYPT_SALT_ROUNDS = '14';
      const reg = makeRegistration({ status: RegistrationStatus.MFA_VERIFIED, mfaVerifiedAt: new Date() });
      mockRepo.findOne.mockResolvedValue(reg);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      await service.completeRegistration('test-uuid-123', dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('peppered_hex_value', 14);
    });

    it('throws BadRequestException when MFA not verified', async () => {
      const reg = makeRegistration({ status: RegistrationStatus.MFA_VERIFIED, mfaVerifiedAt: null });
      mockRepo.findOne.mockResolvedValue(reg);
      await expect(service.completeRegistration('x', dto)).rejects.toThrow(new BadRequestException('MFA verification required before completing registration'));
    });

    it('throws BadRequestException when status is not MFA_VERIFIED', async () => {
      const reg = makeRegistration({ status: RegistrationStatus.MFA_SENT, mfaVerifiedAt: new Date() });
      mockRepo.findOne.mockResolvedValue(reg);
      await expect(service.completeRegistration('x', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException with missing fields list', async () => {
      const reg = makeRegistration({ status: RegistrationStatus.MFA_VERIFIED, mfaVerifiedAt: new Date(), name: null });
      mockRepo.findOne.mockResolvedValue(reg);
      await expect(service.completeRegistration('x', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.completeRegistration('x', dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── processAbandoned ───────────────────────────────────────────────────────

  describe('processAbandoned', () => {
    it('sends abandonment emails and returns correct counts', async () => {
      const registrations = [
        makeRegistration({ id: 'uuid-1', email: 'a@example.com' }),
        makeRegistration({ id: 'uuid-2', email: 'b@example.com' }),
      ];
      mockRepo.find.mockResolvedValue(registrations);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      const result = await service.processAbandoned();

      expect(mockEmail.sendAbandonmentReminder).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ processed: 2, errors: 0 });
    });

    it('counts errors without stopping processing', async () => {
      const registrations = [
        makeRegistration({ id: 'uuid-1', email: 'a@example.com' }),
        makeRegistration({ id: 'uuid-2', email: 'b@example.com' }),
      ];
      mockRepo.find.mockResolvedValue(registrations);
      mockRepo.save.mockImplementation(saveRegistrationMock);
      mockEmail.sendAbandonmentReminder
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(undefined);

      const result = await service.processAbandoned();

      expect(result).toEqual({ processed: 1, errors: 1 });
    });

    it('sets abandonmentEmailSentAt after sending', async () => {
      const reg = makeRegistration();
      mockRepo.find.mockResolvedValue([reg]);
      mockRepo.save.mockImplementation(saveRegistrationMock);

      await service.processAbandoned();

      const saved = mockRepo.save.mock.calls[0][0];
      expect(saved.abandonmentEmailSentAt).toBeInstanceOf(Date);
    });

    it('returns zeros when no abandoned registrations', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.processAbandoned();
      expect(result).toEqual({ processed: 0, errors: 0 });
    });

    it('uses 30-minute threshold', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.processAbandoned();

      const findArg = mockRepo.find.mock.calls[0][0] as Record<string, unknown>;
      expect(findArg).toEqual(expect.objectContaining({ take: 50, order: { updatedAt: 'ASC' } }));
      expect((findArg.where as Record<string, unknown>).updatedAt).toBeDefined();
    });
  });
});
