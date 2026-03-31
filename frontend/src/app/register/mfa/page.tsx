'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mfaSchema } from '@/lib/validations';
import { useRegistration } from '@/hooks/useRegistration';
import { FormField } from '@/components/FormField';
import { FormButton } from '@/components/FormButton';

type FormData = z.infer<typeof mfaSchema>;

export default function MfaPage() {
  const { verifyMfa, registration, startRegistration, isLoading, error, clearError } = useRegistration();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(mfaSchema),
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    await verifyMfa(data.code);
  };

  const handleResend = async () => {
    if (registration?.email) {
      clearError();
      await startRegistration(registration.email);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111827', textAlign: 'center' }}>
        Verificação de Identidade
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
        Enviamos um código de 6 dígitos para seu email. Verifique sua caixa de entrada.
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
        <FormField label="Código de verificação" error={errors.code?.message}>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            {...register('code')}
            style={{
              width: '100%',
              padding: '16px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 32,
              boxSizing: 'border-box',
              textAlign: 'center',
              letterSpacing: '0.5em',
              fontWeight: 700,
            }}
          />
        </FormField>

        <FormButton type="submit" isLoading={isLoading}>
          Verificar Código
        </FormButton>
      </form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontSize: 14,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Reenviar código
        </button>
      </div>
    </div>
  );
}
