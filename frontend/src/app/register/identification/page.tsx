'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { identificationSchema } from '@/lib/validations';
import { useRegistration } from '@/hooks/useRegistration';
import { FormField } from '@/components/FormField';
import { FormButton } from '@/components/FormButton';

type FormData = z.infer<typeof identificationSchema>;

export default function IdentificationPage() {
  const { startRegistration, isLoading, error, clearError } = useRegistration();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(identificationSchema),
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    await startRegistration(data.email);
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
        Bem-vindo ao Predictus
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        Informe seu e-mail para iniciar o cadastro. Você receberá um código de verificação.
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
        <FormField label="E-mail" error={errors.email?.message}>
          <input
            type="email"
            placeholder="seu@email.com"
            {...register('email')}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 16,
              boxSizing: 'border-box',
            }}
          />
        </FormField>

        <FormButton type="submit" isLoading={isLoading}>
          Continuar
        </FormButton>
      </form>
    </div>
  );
}
