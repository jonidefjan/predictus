import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { IEmailProvider } from '../../domain/interfaces/email-provider.interface';

@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMfaCode(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@predictus.app',
      to: email,
      subject: 'Your verification code',
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in ${process.env.MFA_EXPIRATION_MINUTES ?? '5'} minutes.</p>`,
    });
  }
}
