import { z } from 'zod';

export const identificationSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
});

export const personalDataSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: z
    .string()
    .min(11, 'CPF inválido')
    .max(14, 'CPF inválido')
    .refine((val) => /^\d{11}$/.test(val.replace(/\D/g, '')), 'CPF inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
});

export const addressSchema = z.object({
  cep: z.string().min(8, 'CEP inválido').max(9, 'CEP inválido'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2),
});

export const mfaSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

export const reviewSchema = z
  .object({
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });
