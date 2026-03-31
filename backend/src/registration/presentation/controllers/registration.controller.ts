import {
  Body,
  Controller,
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

@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly startRegistration: StartRegistrationUseCase,
    private readonly updateStep: UpdateRegistrationStepUseCase,
    private readonly completeRegistration: CompleteRegistrationUseCase,
    private readonly verifyMfa: VerifyMfaUseCase,
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
}
