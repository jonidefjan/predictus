'use client';

import React from 'react';

type MaskType = 'cpf' | 'phone' | 'cep';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  onChange?: (value: string) => void;
}

function applyMask(value: string, mask: MaskType): string {
  const digits = value.replace(/\D/g, '');

  if (mask === 'cpf') {
    return digits
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  if (mask === 'phone') {
    return digits
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }

  if (mask === 'cep') {
    return digits.slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2');
  }

  return value;
}

export function MaskedInput({ mask, onChange, value, ...rest }: MaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (onChange) onChange(raw);
  };

  const maskedValue = value !== undefined ? applyMask(String(value), mask) : undefined;

  return (
    <input
      {...rest}
      value={maskedValue}
      onChange={handleChange}
      style={{
        width: '100%',
        padding: '12px',
        border: '1px solid #d1d5db',
        borderRadius: 6,
        fontSize: 16,
        boxSizing: 'border-box',
        outline: 'none',
        ...rest.style,
      }}
    />
  );
}
