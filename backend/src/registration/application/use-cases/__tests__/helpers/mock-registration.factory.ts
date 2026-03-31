import { Registration } from '../../../../domain/entities/registration.entity';
import { RegistrationStatus } from '../../../../domain/enums/registration-status.enum';

export function createMockRegistration(overrides: Partial<Registration> = {}): Registration {
  const registration = new Registration();
  registration.id = 'test-uuid-123';
  registration.email = 'test@example.com';
  registration.name = 'Test User';
  registration.cpf = '12345678901';
  registration.phone = '11999999999';
  registration.birthDate = new Date('1990-01-01');
  registration.cep = '01001000';
  registration.street = 'Praça da Sé';
  registration.number = '100';
  registration.complement = '';
  registration.neighborhood = 'Sé';
  registration.city = 'São Paulo';
  registration.state = 'SP';
  registration.password = null;
  registration.status = RegistrationStatus.PENDING;
  registration.currentStep = 1;
  registration.mfaCode = '123456';
  registration.mfaExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  registration.mfaVerifiedAt = null;
  registration.abandonmentEmailSentAt = null;
  registration.createdAt = new Date();
  registration.updatedAt = new Date();

  return Object.assign(registration, overrides);
}
