'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getResumeRoute } from '@/lib/registration-flow';

const STORAGE_KEY = 'predictus_registration_id';

export default function ResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      setError('Link inválido. Por favor, inicie um novo cadastro.');
      return;
    }

    api
      .getRegistration(id)
      .then((registration) => {
        localStorage.setItem(STORAGE_KEY, id);
        const route = getResumeRoute(registration);
        router.replace(route);
      })
      .catch(() => {
        setError('Não foi possível carregar seu cadastro. O link pode ter expirado.');
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
          Não foi possível continuar
        </h1>
        <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 24 }}>{error}</p>
        <a
          href="/register/identification"
          style={{ color: '#2563eb', fontSize: 14, textDecoration: 'underline' }}
        >
          Iniciar novo cadastro
        </a>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <p style={{ fontSize: 14, color: '#6b7280' }}>Carregando seu cadastro...</p>
    </div>
  );
}
