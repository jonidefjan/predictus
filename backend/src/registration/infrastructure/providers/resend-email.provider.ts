import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { IEmailProvider } from '../../domain/interfaces/email-provider.interface';

@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMfaCode(to: string, code: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject: 'Predictus - Seu código de verificação',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #333;">Predictus</h2>
            <p>Olá! Seu código de verificação é:</p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px;">Este código expira em ${process.env.MFA_EXPIRATION_MINUTES || '5'} minutos.</p>
            <p style="color: #999; font-size: 12px;">Se você não solicitou este código, ignore este email.</p>
          </div>
        `,
      });

      this.logger.log(`MFA code sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send MFA code to ${to}`, error);
      throw error;
    }
  }

  async sendAbandonmentReminder(to: string, registrationId: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject: 'Predictus - Continue seu cadastro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #333;">Predictus</h2>
            <p>Olá! Notamos que você iniciou seu cadastro mas não finalizou.</p>
            <p>Seu progresso foi salvo! Clique no botão abaixo para continuar de onde parou:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/register/resume?id=${registrationId}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Continuar Cadastro
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">Se você não iniciou este cadastro, ignore este email.</p>
          </div>
        `,
      });
      this.logger.log(`Abandonment reminder sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send abandonment reminder to ${to}`, error);
      throw error;
    }
  }
}
