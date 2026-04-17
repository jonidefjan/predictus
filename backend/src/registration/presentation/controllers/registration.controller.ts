import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RegistrationService } from '../../registration.service';
import { StartRegistrationDto } from '../../application/dtos/start-registration.dto';
import { UpdateStepDto } from '../../application/dtos/update-step.dto';
import { CompleteRegistrationDto } from '../../application/dtos/complete-registration.dto';
import { VerifyMfaDto } from '../../application/dtos/verify-mfa.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly service: RegistrationService) {}

  @Post('start')
  start(@Body() dto: StartRegistrationDto) {
    return this.service.startRegistration(dto);
  }

  @Patch(':id/step')
  updateStep(@Param('id') id: string, @Body() dto: UpdateStepDto) {
    return this.service.updateStep(id, dto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteRegistrationDto) {
    return this.service.completeRegistration(id, dto);
  }

  @Post(':id/mfa')
  verifyMfa(@Param('id') id: string, @Body() dto: VerifyMfaDto) {
    return this.service.verifyMfa(id, dto);
  }

  @Post(':id/mfa/resend')
  resendMfa(@Param('id') id: string) {
    return this.service.resendMfa(id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
