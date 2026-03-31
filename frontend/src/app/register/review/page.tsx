'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reviewSchema } from '@/lib/validations';
import { useRegistration } from '@/hooks/useRegistration';
import { FormField } from '@/components/FormField';
import { FormButton } from '@/components/FormButton';

type FormData = z.infer<typeof reviewSchema>;

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  marginBottom: 2,
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#111827',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 16,
  boxSizing: 'border-box',
};

function DataRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value || '—'}</p>
    </div>
  );
}

export default function ReviewPage() {
  const { completeRegistration, registration, isLoading, error, clearError } = useRegistration();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(reviewSchema),
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    await completeRegistration(data.password);
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
        Revisão dos Dados
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
        Confirme seus dados e defina uma senha para concluir o cadastro.
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

      <div
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: 6,
          padding: '16px',
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dados Pessoais
        </h2>
        <DataRow label="E-mail" value={registration?.email} />
        <DataRow label="Nome" value={registration?.name} />
        <DataRow label="CPF" value={registration?.cpf} />
        <DataRow label="Telefone" value={registration?.phone} />
        <DataRow label="Data de Nascimento" value={registration?.birthDate} />

        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '16px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Endereço
        </h2>
        <DataRow label="CEP" value={registration?.cep} />
        <DataRow
          label="Logradouro"
          value={[registration?.street, registration?.number, registration?.complement].filter(Boolean).join(', ')}
        />
        <DataRow label="Bairro" value={registration?.neighborhood} />
        <DataRow
          label="Cidade / UF"
          value={[registration?.city, registration?.state].filter(Boolean).join(' / ')}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Senha" error={errors.password?.message}>
          <input
            type="password"
            placeholder="Mínimo 8 caracteres"
            {...register('password')}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Confirmar Senha" error={errors.confirmPassword?.message}>
          <input
            type="password"
            placeholder="Repita a senha"
            {...register('confirmPassword')}
            style={inputStyle}
          />
        </FormField>

        <FormButton type="submit" isLoading={isLoading}>
          Concluir Cadastro
        </FormButton>
      </form>
    </div>
  );
}
