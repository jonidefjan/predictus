import { Injectable, Logger } from '@nestjs/common';
import { ICepProvider, CepResponse } from '../../domain/interfaces/cep-provider.interface';

@Injectable()
export class ViaCepProvider implements ICepProvider {
  private readonly logger = new Logger(ViaCepProvider.name);

  async findByCep(cep: string): Promise<CepResponse | null> {
    const sanitized = cep.replace(/\D/g, '');

    if (sanitized.length !== 8) {
      this.logger.warn(`Invalid CEP format: ${cep}`);
      return null;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${sanitized}/json/`);

      if (!response.ok) {
        this.logger.warn(`ViaCEP returned status ${response.status} for CEP ${sanitized}`);
        return null;
      }

      const data = await response.json() as Record<string, unknown>;

      if (data.erro) {
        this.logger.warn(`CEP not found: ${sanitized}`);
        return null;
      }

      return {
        cep: String(data.cep ?? ''),
        street: String(data.logradouro ?? ''),
        complement: String(data.complemento ?? ''),
        neighborhood: String(data.bairro ?? ''),
        city: String(data.localidade ?? ''),
        state: String(data.uf ?? ''),
      };
    } catch (error) {
      this.logger.error(`Error fetching CEP ${sanitized}`, error);
      return null;
    }
  }
}
