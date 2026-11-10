import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('EMAIL_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('EMAIL_PORT') ?? 587,
        secure: this.config.get<boolean>('EMAIL_SECURE') ?? false,
        auth: this.config.get<string>('EMAIL_USER')
          ? {
              user: this.config.get<string>('EMAIL_USER'),
              pass: this.config.get<string>('EMAIL_PASSWORD'),
            }
          : undefined,
      });
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /** Throws on failure so callers can track/retry; never throws when unconfigured. */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email not configured — skipped message "${subject}" to ${to}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get<string>('EMAIL_FROM'),
      to,
      subject,
      html,
    });
  }
}