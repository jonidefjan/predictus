import { ResendEmailProvider } from '../resend-email.provider';

const mockEmailsSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockEmailsSend,
    },
  })),
}));

describe('ResendEmailProvider', () => {
  let provider: ResendEmailProvider;

  beforeEach(() => {
    provider = new ResendEmailProvider();
    jest.clearAllMocks();
  });

  it('calls Resend emails.send with correct parameters', async () => {
    mockEmailsSend.mockResolvedValueOnce({ id: 'test-id' });

    await provider.sendMfaCode('user@example.com', '123456');

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'onboarding@resend.dev',
        to: 'user@example.com',
        subject: 'Predictus - Seu código de verificação',
      }),
    );
  });

  it('includes the MFA code in the HTML body', async () => {
    mockEmailsSend.mockResolvedValueOnce({ id: 'test-id' });

    await provider.sendMfaCode('user@example.com', '654321');

    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.html).toContain('654321');
  });

  it('re-throws error when Resend SDK fails', async () => {
    const error = new Error('Resend API error');
    mockEmailsSend.mockRejectedValueOnce(error);

    await expect(provider.sendMfaCode('user@example.com', '123456')).rejects.toThrow(
      'Resend API error',
    );
  });
});
