'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { addressSchema } from '@/lib/validations';
import { useRegistration } from '@/hooks/useRegistration';
import { FormField } from '@/components/FormField';
import { FormButton } from '@/components/FormButton';
import { MaskedInput } from '@/components/MaskedInput';

type FormData = z.infer<typeof addressSchema>;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 16,
  boxSizing: 'border-box',
};

export default function AddressPage() {
  const { updateStep, lookupCep, isLoading, error, clearError } = useRegistration();
  const [cepLoading, setCepLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(addressSchema),
  });

  const cepValue = watch('cep');

  useEffect(() => {
    const digits = (cepValue ?? '').replace(/\D/g, '');
    if (digits.length === 8) {
      setCepLoading(true);
      lookupCep(digits).then((data) => {
        if (data) {
          setValue('street', data.street ?? '');
          setValue('neighborhood', data.neighborhood ?? '');
          setValue('city', data.city ?? '');
          setValue('state', data.state ?? '');
        }
        setCepLoading(false);
      });
    }
  }, [cepValue, lookupCep, setValue]);

  const onSubmit = async (data: FormData) => {
    clearError();
    await updateStep(2, {
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    });
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
        Endereço
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        Informe seu CEP e os demais campos serão preenchidos automaticamente.
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
        <FormField label={`CEP${cepLoading ? ' — buscando...' : ''}`} error={errors.cep?.message}>
          <Controller
            name="cep"
            control={control}
            render={({ field }) => (
              <MaskedInput
                mask="cep"
                placeholder="00000-000"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField label="Rua" error={errors.street?.message}>
          <input type="text" placeholder="Nome da rua" {...register('street')} style={inputStyle} />
        </FormField>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <FormField label="Número" error={errors.number?.message}>
              <input type="text" placeholder="Nº" {...register('number')} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ flex: 2 }}>
            <FormField label="Complemento" error={errors.complement?.message}>
              <input type="text" placeholder="Apto, Bloco..." {...register('complement')} style={inputStyle} />
            </FormField>
          </div>
        </div>

        <FormField label="Bairro" error={errors.neighborhood?.message}>
          <input type="text" placeholder="Bairro" {...register('neighborhood')} style={inputStyle} />
        </FormField>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 2 }}>
            <FormField label="Cidade" error={errors.city?.message}>
              <input type="text" placeholder="Cidade" {...register('city')} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="UF" error={errors.state?.message}>
              <input
                type="text"
                placeholder="SP"
                maxLength={2}
                {...register('state')}
                style={{ ...inputStyle, textTransform: 'uppercase' }}
              />
            </FormField>
          </div>
        </div>

        <FormButton type="submit" isLoading={isLoading || cepLoading}>
          Continuar
        </FormButton>
      </form>
    </div>
  );
}
