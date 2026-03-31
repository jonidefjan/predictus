import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 500,
          color: '#374151',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ marginTop: 4, fontSize: 12, color: '#dc2626' }}>{error}</p>
      )}
    </div>
  );
}
