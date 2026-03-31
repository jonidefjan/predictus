import { ViaCepProvider } from '../viacep-cep.provider';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ViaCepProvider', () => {
  let provider: ViaCepProvider;

  beforeEach(() => {
    provider = new ViaCepProvider();
    jest.clearAllMocks();
  });

  it('returns mapped CepResponse for a valid CEP', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: 'lado ímpar',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    });

    const result = await provider.findByCep('01001000');

    expect(result).toEqual({
      cep: '01001-000',
      street: 'Praça da Sé',
      complement: 'lado ímpar',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(mockFetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/');
  });

  it('sanitizes CEP with hyphen and returns CepResponse', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: '',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    });

    const result = await provider.findByCep('01001-000');

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/');
  });

  it('returns null when API responds with erro: true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ erro: true }),
    });

    const result = await provider.findByCep('99999999');

    expect(result).toBeNull();
  });

  it('returns null for invalid CEP format (less than 8 digits)', async () => {
    const result = await provider.findByCep('1234');

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null for CEP with letters', async () => {
    const result = await provider.findByCep('abc12345');

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on network error (does NOT throw)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await provider.findByCep('01001000');

    expect(result).toBeNull();
  });
});
