import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './domain/entities/registration.entity';
import { REGISTRATION_REPOSITORY } from './domain/interfaces/registration-repository.interface';
import { EMAIL_PROVIDER } from './domain/interfaces/email-provider.interface';
import { TypeOrmRegistrationRepository } from './infrastructure/repositories/typeorm-registration.repository';
import { ResendEmailProvider } from './infrastructure/providers/resend-email.provider';
import { StartRegistrationUseCase } from './application/use-cases/start-registration.use-case';
import { UpdateRegistrationStepUseCase } from './application/use-cases/update-registration-step.use-case';
import { CompleteRegistrationUseCase } from './application/use-cases/complete-registration.use-case';
import { VerifyMfaUseCase } from './application/use-cases/verify-mfa.use-case';
import { RegistrationController } from './presentation/controllers/registration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Registration])],
  providers: [
    { provide: REGISTRATION_REPOSITORY, useClass: TypeOrmRegistrationRepository },
    { provide: EMAIL_PROVIDER, useClass: ResendEmailProvider },
    StartRegistrationUseCase,
    UpdateRegistrationStepUseCase,
    CompleteRegistrationUseCase,
    VerifyMfaUseCase,
  ],
  controllers: [RegistrationController],
})
export class RegistrationModule {}
