'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '16px',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          padding: '40px 24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', margin: '0 0 12px' }}>
          Predictus
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
          Faça seu cadastro em poucos passos e acesse nossa plataforma.
        </p>
        <button
          onClick={() => router.push('/register/identification')}
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
          Começar Cadastro
        </button>
      </div>
    </main>
  );
}
