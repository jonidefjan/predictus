import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ViaCepProvider } from '../../infrastructure/providers/viacep-cep.provider';

@Controller('cep')
export class CepController {
  constructor(private readonly cepProvider: ViaCepProvider) {}

  @Get(':cep')
  async findByCep(@Param('cep') cep: string) {
    const result = await this.cepProvider.findByCep(cep);
    if (!result) throw new NotFoundException(`CEP ${cep} not found`);
    return result;
  }
}
