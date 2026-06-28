export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export class ResendEmailAdapter {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(input: SendEmailInput): Promise<void> {
    if (!this.apiKey || !this.from || !input.to) {
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Resend failed: ${message}`);
    }
  }
}