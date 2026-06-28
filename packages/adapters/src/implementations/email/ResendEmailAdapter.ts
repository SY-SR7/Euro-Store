/**
 * ResendEmailAdapter — sends transactional email via Resend.
 * Uses the adapter interface so swapping providers needs no app-layer change.
 */
import type { IEmailAdapter, SendEmailOptions } from '../../interfaces/IEmailAdapter';

export class ResendEmailAdapter implements IEmailAdapter {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from   = from;
  }

  async send(options: SendEmailOptions): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method : 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type' : 'application/json',
      },
      body: JSON.stringify({
        from   : this.from,
        to     : [options.to],
        subject: options.subject,
        html   : options.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Resend error ${res.status}: ${text}`);
    }
  }
}