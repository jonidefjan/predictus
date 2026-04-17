export function digitsOnly(value: string | undefined | null) {
  return (value ?? '').replace(/\D/g, '');
}

export function formatCpf(value: string | undefined | null) {
  const digits = digitsOnly(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatPhoneBR(value: string | undefined | null) {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function formatCep(value: string | undefined | null) {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

function parseDateParts(value: string | undefined | null) {
  if (!value) return null;

  const normalized = value.slice(0, 10);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
}

export function formatDateBR(value: string | undefined | null) {
  const parts = parseDateParts(value);
  if (!parts) return value ?? '';
  return `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}`;
}

export function formatDateForInput(value: string | undefined | null) {
  const parts = parseDateParts(value);
  if (!parts) return '';
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}