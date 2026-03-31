'use client';

import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
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

        return (
          <React.Fragment key={stepNumber}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#d1d5db',
                  color: isCompleted || isActive ? '#ffffff' : '#6b7280',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: isActive ? '#2563eb' : isCompleted ? '#16a34a' : '#9ca3af',
                  textAlign: 'center',
                  maxWidth: 56,
                  lineHeight: 1.2,
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
                  backgroundColor: stepNumber < currentStep ? '#16a34a' : '#d1d5db',
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
