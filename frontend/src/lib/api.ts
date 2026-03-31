const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  async startRegistration(email: string) {
    const res = await fetch(`${API_URL}/registration/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateStep(id: string, step: number, data: Record<string, unknown>) {
    const res = await fetch(`${API_URL}/registration/${id}/step`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, data }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async verifyMfa(id: string, code: string) {
    const res = await fetch(`${API_URL}/registration/${id}/mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async completeRegistration(id: string, password: string) {
    const res = await fetch(`${API_URL}/registration/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async resendMfa(id: string) {
    const res = await fetch(`${API_URL}/registration/${id}/mfa/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getRegistration(id: string) {
    const res = await fetch(`${API_URL}/registration/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async lookupCep(cep: string) {
    const res = await fetch(`${API_URL}/cep/${cep}`);
    if (!res.ok) return null;
    return res.json();
  },
};
