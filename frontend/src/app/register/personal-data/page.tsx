'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { personalDataSchema } from '@/lib/validations';
import { useRegistration } from '@/hooks/useRegistration';
import { FormField } from '@/components/FormField';
import { FormButton } from '@/components/FormButton';
import { MaskedInput } from '@/components/MaskedInput';
import { formatDateForInput } from '@/lib/formatters';

type FormData = z.infer<typeof personalDataSchema>;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 16,
  boxSizing: 'border-box',
};

export default function PersonalDataPage() {
  const router = useRouter();
  const { updateStep, registration, isLoading, error, clearError } = useRegistration();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(personalDataSchema),
  });

  useEffect(() => {
    if (!registration) return;

    reset({
      name: registration.name ?? '',
      cpf: registration.cpf ?? '',
      phone: registration.phone ?? '',
      birthDate: formatDateForInput(registration.birthDate),
    });
  }, [registration, reset]);

  const onSubmit = async (data: FormData) => {
    clearError();
    await updateStep(1, { name: data.name, cpf: data.cpf, phone: data.phone, birthDate: data.birthDate });
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
        Dados Pessoais
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        Preencha seus dados pessoais para continuar.
      </p>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            color: '#dc2626',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Nome completo" error={errors.name?.message}>
          <input
            type="text"
            placeholder="Seu nome completo"
            {...register('name')}
            style={inputStyle}
          />
        </FormField>

        <FormField label="CPF" error={errors.cpf?.message}>
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <MaskedInput
                mask="cpf"
                placeholder="000.000.000-00"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField label="Telefone" error={errors.phone?.message}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <MaskedInput
                mask="phone"
                placeholder="(00) 00000-0000"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField label="Data de nascimento" error={errors.birthDate?.message}>
          <input
            type="date"
            {...register('birthDate')}
            style={inputStyle}
          />
        </FormField>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <FormButton type="button" variant="secondary" onClick={() => router.push('/register/identification')}>
              Voltar
            </FormButton>
          </div>
          <div style={{ flex: 1 }}>
            <FormButton type="submit" isLoading={isLoading}>
              Continuar
            </FormButton>
          </div>
        </div>
      </form>
    </div>
  );
}
