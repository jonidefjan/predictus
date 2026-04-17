'use client';

import { usePathname } from 'next/navigation';
import { StepIndicator } from '@/components/StepIndicator';
import { useRegistration } from '@/hooks/useRegistration';
import { getMaxAccessibleStep } from '@/lib/registration-flow';

const STEP_LABELS = ['Identificação', 'Dados Pessoais', 'Endereço', 'MFA', 'Revisão'];

const PATH_TO_STEP: Record<string, number> = {
  '/register/identification': 1,
  '/register/personal-data': 2,
  '/register/address': 3,
  '/register/mfa': 4,
  '/register/review': 5,
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { registration, goToStep } = useRegistration();
  const currentStep = PATH_TO_STEP[pathname] ?? 0;
  const isSuccess = pathname === '/register/success';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ marginBottom: 8, paddingTop: 16 }}>
          <h2 style={{ textAlign: 'center', color: '#2563eb', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
            Predictus
          </h2>
          {!isSuccess && currentStep > 0 && (
            <StepIndicator
              currentStep={currentStep}
              steps={STEP_LABELS}
              maxAccessibleStep={getMaxAccessibleStep(registration)}
              onStepClick={goToStep}
            />
          )}
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 8,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
