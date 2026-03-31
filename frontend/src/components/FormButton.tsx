import React from 'react';

interface FormButtonProps {
  children: React.ReactNode;
  type?: 'submit' | 'button';
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function FormButton({
  children,
  type = 'button',
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'primary',
}: FormButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: 6,
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        border: isPrimary ? 'none' : '1.5px solid #2563eb',
        backgroundColor: isPrimary ? (disabled || isLoading ? '#93c5fd' : '#2563eb') : 'transparent',
        color: isPrimary ? '#ffffff' : '#2563eb',
        transition: 'background-color 0.2s',
      }}
    >
      {isLoading ? 'Carregando...' : children}
    </button>
  );
}
