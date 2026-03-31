import { Controller, Get, Param, NotFoundException, Inject } from '@nestjs/common';
import { ICepProvider, CEP_PROVIDER } from '../../domain/interfaces/cep-provider.interface';

@Controller('cep')
export class CepController {
  constructor(
    @Inject(CEP_PROVIDER) private readonly cepProvider: ICepProvider,
  ) {}

  @Get(':cep')
  async findByCep(@Param('cep') cep: string) {
    const result = await this.cepProvider.findByCep(cep);

    if (!result) {
      throw new NotFoundException(`CEP ${cep} not found`);
    }

    return result;
  }
}
