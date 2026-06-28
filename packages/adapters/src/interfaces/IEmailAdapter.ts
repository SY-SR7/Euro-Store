export interface SendEmailOptions {
  to      : string;
  subject : string;
  html    : string;
}

export interface IEmailAdapter {
  send(options: SendEmailOptions): Promise<void>;
}