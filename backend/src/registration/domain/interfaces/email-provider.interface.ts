export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

export interface IEmailProvider {
  sendMfaCode(email: string, code: string): Promise<void>;
  sendAbandonmentReminder(to: string, registrationId: string): Promise<void>;
}
