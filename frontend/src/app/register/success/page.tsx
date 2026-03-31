'use client';

import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#16a34a', marginBottom: 12 }}>
        Cadastro realizado com sucesso!
      </h1>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
        Seu cadastro foi concluído. Agora você pode acessar a plataforma Predictus.
      </p>
      <button
        onClick={() => router.push('/')}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 600,
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Voltar ao início
      </button>
    </div>
  );
}
