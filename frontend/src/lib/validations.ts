import { z } from 'zod';

function isValidBrazilPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return /^(?:[1-9]{2})(?:\d{8}|9\d{8})$/.test(digits);
}

function isValidBirthDate(value: string) {
  if (!value) return false;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const now = new Date();
  if (date > now || year < 1900) return false;

  let age = now.getFullYear() - year;
  const hadBirthdayThisYear =
    now.getMonth() > month - 1 ||
    (now.getMonth() === month - 1 && now.getDate() >= day);

  if (!hadBirthdayThisYear) age -= 1;

  return age >= 18;
}

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
  phone: z.string().refine(isValidBrazilPhone, 'Telefone brasileiro inválido'),
  birthDate: z.string().refine(isValidBirthDate, 'Data de nascimento inválida ou menor de 18 anos'),
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
