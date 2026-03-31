import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './domain/entities/registration.entity';
import { REGISTRATION_REPOSITORY } from './domain/interfaces/registration-repository.interface';
import { EMAIL_PROVIDER } from './domain/interfaces/email-provider.interface';
import { CEP_PROVIDER } from './domain/interfaces/cep-provider.interface';
import { TypeOrmRegistrationRepository } from './infrastructure/repositories/typeorm-registration.repository';
import { ResendEmailProvider } from './infrastructure/providers/resend-email.provider';
import { ViaCepProvider } from './infrastructure/providers/viacep-cep.provider';
import { StartRegistrationUseCase } from './application/use-cases/start-registration.use-case';
import { UpdateRegistrationStepUseCase } from './application/use-cases/update-registration-step.use-case';
import { CompleteRegistrationUseCase } from './application/use-cases/complete-registration.use-case';
import { VerifyMfaUseCase } from './application/use-cases/verify-mfa.use-case';
import { ResendMfaUseCase } from './application/use-cases/resend-mfa.use-case';
import { ProcessAbandonedRegistrationsUseCase } from './application/use-cases/process-abandoned-registrations.use-case';
import { AbandonmentScheduler } from './infrastructure/schedulers/abandonment.scheduler';
import { RegistrationController } from './presentation/controllers/registration.controller';
import { CepController } from './presentation/controllers/cep.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Registration])],
  controllers: [RegistrationController, CepController],
  providers: [
    { provide: REGISTRATION_REPOSITORY, useClass: TypeOrmRegistrationRepository },
    { provide: EMAIL_PROVIDER, useClass: ResendEmailProvider },
    { provide: CEP_PROVIDER, useClass: ViaCepProvider },
    StartRegistrationUseCase,
    UpdateRegistrationStepUseCase,
    CompleteRegistrationUseCase,
    VerifyMfaUseCase,
    ResendMfaUseCase,
    ProcessAbandonedRegistrationsUseCase,
    AbandonmentScheduler,
  ],
})
export class RegistrationModule {}
