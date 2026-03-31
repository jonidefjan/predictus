export interface CepResponse {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ICepProvider {
  findByCep(cep: string): Promise<CepResponse | null>;
}

export const CEP_PROVIDER = 'CEP_PROVIDER';
