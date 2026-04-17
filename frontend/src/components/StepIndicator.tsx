'use client';

import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  maxAccessibleStep?: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ currentStep, steps, maxAccessibleStep = currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 8px',
        overflowX: 'auto',
      }}
    >
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isLocked = stepNumber > maxAccessibleStep;
        const isClickable = stepNumber <= maxAccessibleStep && !!onStepClick;

        return (
          <React.Fragment key={stepNumber}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(stepNumber)}
                disabled={!isClickable}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: isCompleted ? '#16a34a' : isActive ? '#2563eb' : isLocked ? '#f8fafc' : '#dbeafe',
                  color: isCompleted || isActive ? '#ffffff' : isLocked ? '#94a3b8' : '#1d4ed8',
                  flexShrink: 0,
                  border: isLocked ? '1px dashed #cbd5e1' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: isLocked ? 0.85 : 1,
                }}
                aria-disabled={!isClickable}
                title={isLocked ? 'Etapa ainda não liberada' : undefined}
              >
                {isCompleted ? '✓' : isLocked ? 'x' : stepNumber}
              </button>
              <span
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: isActive ? '#2563eb' : isCompleted ? '#16a34a' : isLocked ? '#94a3b8' : '#3b82f6',
                  textAlign: 'center',
                  maxWidth: 56,
                  lineHeight: 1.2,
                  opacity: isLocked ? 0.8 : 1,
                }}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: stepNumber < currentStep ? '#16a34a' : stepNumber < maxAccessibleStep ? '#bfdbfe' : '#e5e7eb',
                  marginBottom: 20,
                  minWidth: 8,
                  maxWidth: 40,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
