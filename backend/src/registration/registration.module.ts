import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './domain/entities/registration.entity';
import { ResendEmailProvider } from './infrastructure/providers/resend-email.provider';
import { ViaCepProvider } from './infrastructure/providers/viacep-cep.provider';
import { AbandonmentScheduler } from './infrastructure/schedulers/abandonment.scheduler';
import { RegistrationController } from './presentation/controllers/registration.controller';
import { CepController } from './presentation/controllers/cep.controller';
import { RegistrationService } from './registration.service';

@Module({
  imports: [TypeOrmModule.forFeature([Registration])],
  controllers: [RegistrationController, CepController],
  providers: [
    ResendEmailProvider,
    ViaCepProvider,
    RegistrationService,
    AbandonmentScheduler,
  ],
})
export class RegistrationModule {}
