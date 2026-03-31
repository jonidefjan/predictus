'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Registration } from '@/types/registration';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: '#92400e', bg: '#fef3c7' },
  mfa_sent: { label: 'MFA Enviado', color: '#1e40af', bg: '#dbeafe' },
  mfa_verified: { label: 'MFA Verificado', color: '#065f46', bg: '#d1fae5' },
  completed: { label: 'Concluído', color: '#166534', bg: '#bbf7d0' },
  abandoned: { label: 'Abandonado', color: '#991b1b', bg: '#fecaca' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_LABELS[status] || { label: status, color: '#374151', bg: '#f3f4f6' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCpf(cpf?: string) {
  if (!cpf) return '—';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default function RecordsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listRegistrations();
      setRegistrations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
            Registros
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {registrations.length} registro{registrations.length !== 1 ? 's' : ''} encontrado{registrations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchData}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: '#374151',
            }}
          >
            {isLoading ? 'Carregando...' : 'Atualizar'}
          </button>
          <a
            href="/register/identification"
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#2563eb',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              color: '#fff',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            + Novo Cadastro
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
        {error && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#dc2626',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {isLoading && registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            Carregando registros...
          </div>
        ) : registrations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              backgroundColor: '#fff',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          >
            <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>
              Nenhum registro encontrado.
            </p>
            <a
              href="/register/identification"
              style={{ color: '#2563eb', fontSize: 14, marginTop: 8, display: 'inline-block' }}
            >
              Iniciar novo cadastro
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {registrations.map((reg) => (
              <div
                key={reg.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => toggleExpand(reg.id)}
                  style={{
                    padding: '14px 20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto auto',
                    alignItems: 'center',
                    gap: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
                      {reg.name || reg.email}
                    </p>
                    {reg.name && (
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
                        {reg.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                      {formatDate(reg.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={reg.status} />
                  <span style={{ fontSize: 14, color: '#9ca3af', transition: 'transform 0.2s', transform: expandedId === reg.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ▼
                  </span>
                </div>

                {expandedId === reg.id && (
                  <div
                    style={{
                      borderTop: '1px solid #e5e7eb',
                      padding: '16px 20px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px 32px',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <Detail label="ID" value={reg.id} mono />
                    <Detail label="E-mail" value={reg.email} />
                    <Detail label="Nome" value={reg.name} />
                    <Detail label="CPF" value={formatCpf(reg.cpf)} />
                    <Detail label="Telefone" value={reg.phone} />
                    <Detail label="Data de Nascimento" value={reg.birthDate} />
                    <Detail label="CEP" value={reg.cep} />
                    <Detail
                      label="Endereço"
                      value={[reg.street, reg.number, reg.complement].filter(Boolean).join(', ') || undefined}
                    />
                    <Detail label="Bairro" value={reg.neighborhood} />
                    <Detail
                      label="Cidade / UF"
                      value={reg.city && reg.state ? `${reg.city} / ${reg.state}` : undefined}
                    />
                    <Detail label="Etapa Atual" value={String(reg.currentStep)} />
                    <Detail label="Status" value={reg.status} />
                    <Detail label="MFA Verificado em" value={formatDate(reg.mfaVerifiedAt)} />
                    <Detail label="Criado em" value={formatDate(reg.createdAt)} />
                    <Detail label="Atualizado em" value={formatDate(reg.updatedAt)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p
        style={{
          margin: '2px 0 0',
          fontSize: 14,
          color: value && value !== '—' ? '#111827' : '#9ca3af',
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? 12 : 14,
          wordBreak: 'break-all',
        }}
      >
        {value || '—'}
      </p>
    </div>
  );
}
