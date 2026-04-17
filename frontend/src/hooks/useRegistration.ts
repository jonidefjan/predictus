'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Registration } from '@/types/registration';
import { STEP_ROUTES, getRouteByUiStep } from '@/lib/registration-flow';

const STORAGE_KEY = 'predictus_registration_id';

export function useRegistration() {
  const router = useRouter();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setRegistrationId(stored);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (registrationId) {
      localStorage.setItem(STORAGE_KEY, registrationId);
    }
  }, [registrationId]);

  // Fetch registration data when id is restored from localStorage
  useEffect(() => {
    if (!registrationId || registration) return;
    let cancelled = false;
    api.getRegistration(registrationId).then((data) => {
      if (!cancelled) setRegistration(data);
    }).catch(() => {
      // If fetch fails (e.g. deleted), clear stale id
      localStorage.removeItem(STORAGE_KEY);
      setRegistrationId(null);
    });
    return () => { cancelled = true; };
  }, [registrationId, registration]);

  const startRegistration = useCallback(
    async (email: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.startRegistration(email);
        setRegistrationId(data.id);
        setRegistration(data);
        router.push('/register/personal-data');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao iniciar cadastro');
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const updateStep = useCallback(
    async (step: number, formData: Record<string, unknown>) => {
      if (!registrationId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.updateStep(registrationId, step, formData);
        setRegistration(data);
        const nextRoute = STEP_ROUTES[step + 1];
        if (nextRoute) router.push(nextRoute);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
      } finally {
        setIsLoading(false);
      }
    },
    [registrationId, router],
  );

  const verifyMfa = useCallback(
    async (code: string) => {
      if (!registrationId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.verifyMfa(registrationId, code);
        setRegistration(data);
        router.push('/register/review');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Código inválido ou expirado');
      } finally {
        setIsLoading(false);
      }
    },
    [registrationId, router],
  );

  const completeRegistration = useCallback(
    async (password: string) => {
      if (!registrationId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.completeRegistration(registrationId, password);
        setRegistration(data);
        localStorage.removeItem(STORAGE_KEY);
        router.push('/register/success');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao finalizar cadastro');
      } finally {
        setIsLoading(false);
      }
    },
    [registrationId, router],
  );

  const lookupCep = useCallback(async (cep: string) => {
    try {
      return await api.lookupCep(cep);
    } catch {
      return null;
    }
  }, []);

  const resendMfa = useCallback(async () => {
    if (!registrationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.resendMfa(registrationId);
      setRegistration(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar código');
    } finally {
      setIsLoading(false);
    }
  }, [registrationId]);

  const clearError = useCallback(() => setError(null), []);

  const goToStep = useCallback(
    (step: number) => {
      router.push(getRouteByUiStep(step));
    },
    [router],
  );

  return {
    registrationId,
    registration,
    isLoading,
    error,
    startRegistration,
    updateStep,
    verifyMfa,
    resendMfa,
    completeRegistration,
    lookupCep,
    clearError,
    goToStep,
  };
}
