import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StartRegistrationDto } from '../../application/dtos/start-registration.dto';
import { UpdateStepDto } from '../../application/dtos/update-step.dto';
import { CompleteRegistrationDto } from '../../application/dtos/complete-registration.dto';
import { VerifyMfaDto } from '../../application/dtos/verify-mfa.dto';
import { StartRegistrationUseCase } from '../../application/use-cases/start-registration.use-case';
import { UpdateRegistrationStepUseCase } from '../../application/use-cases/update-registration-step.use-case';
import { CompleteRegistrationUseCase } from '../../application/use-cases/complete-registration.use-case';
import { VerifyMfaUseCase } from '../../application/use-cases/verify-mfa.use-case';
import { ResendMfaUseCase } from '../../application/use-cases/resend-mfa.use-case';
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/interfaces/registration-repository.interface';
import { Registration } from '../../domain/entities/registration.entity';

@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly startRegistration: StartRegistrationUseCase,
    private readonly updateStep: UpdateRegistrationStepUseCase,
    private readonly completeRegistration: CompleteRegistrationUseCase,
    private readonly verifyMfa: VerifyMfaUseCase,
    private readonly resendMfaUseCase: ResendMfaUseCase,
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationRepo: IRegistrationRepository,
  ) {}

  @Post('start')
  async start(@Body() dto: StartRegistrationDto) {
    return this.startRegistration.execute(dto);
  }

  @Patch(':id/step')
  async updateRegistrationStep(
    @Param('id') id: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.updateStep.execute(id, dto);
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteRegistrationDto,
  ) {
    return this.completeRegistration.execute(id, dto);
  }

  @Post(':id/mfa')
  async mfa(@Param('id') id: string, @Body() dto: VerifyMfaDto) {
    return this.verifyMfa.execute(id, dto);
  }

  @Post(':id/mfa/resend')
  async resendMfa(@Param('id') id: string) {
    return this.resendMfaUseCase.execute(id);
  }

  @Get()
  async listRegistrations(): Promise<Omit<Registration, 'mfaCode' | 'password'>[]> {
    const registrations = await this.registrationRepo.findAll();
    return registrations.map(({ mfaCode: _m, password: _p, ...rest }) => rest);
  }

  @Get(':id')
  async getRegistration(@Param('id') id: string): Promise<Omit<Registration, 'mfaCode' | 'password'>> {
    const registration = await this.registrationRepo.findById(id);
    if (!registration) throw new NotFoundException('Registration not found');
    const { mfaCode: _mfaCode, password: _password, ...result } = registration;
    return result;
  }
}
