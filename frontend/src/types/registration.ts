export interface Registration {
  id: string;
  email: string;
  name?: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  status: string;
  currentStep: number;
  mfaVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CepResponse {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}
