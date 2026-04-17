import { Registration } from '@/types/registration';

export const STEP_ROUTES = [
  '/register/identification',
  '/register/personal-data',
  '/register/address',
  '/register/mfa',
  '/register/review',
  '/register/success',
];

export function getResumeRoute(registration: Registration) {
  if (registration.status === 'completed') {
    return '/register/success';
  }

  if (registration.status === 'mfa_verified') {
    return '/register/review';
  }

  const index = Math.min(Math.max(registration.currentStep, 0), STEP_ROUTES.length - 2);
  return STEP_ROUTES[index] ?? '/register/identification';
}

export function getMaxAccessibleStep(registration: Registration | null) {
  if (!registration) return 1;

  if (registration.status === 'completed' || registration.status === 'mfa_verified') {
    return 5;
  }

  return Math.min((registration.currentStep ?? 1) + 1, 4);
}

export function getRouteByUiStep(step: number) {
  return STEP_ROUTES[Math.max(0, step - 1)] ?? '/register/identification';
}