/**
 * @eurostore/adapters — IEmailAdapter
 *
 * Interface for all email delivery services.
 * Business logic NEVER calls Resend/Nodemailer SDKs directly — always through this interface.
 *
 * Current implementation: ResendEmailAdapter
 * Future: NodemailerAdapter (SMTP fallback)
 */

export interface EmailAttachment {
  filename: string;
  /** File content as Buffer (server-side) or base64 string */
  content: Buffer | string;
  contentType: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  /** Full HTML email body */
  htmlBody: string;
  /** Plain-text fallback for email clients that don't render HTML */
  textBody?: string;
  /** Defaults to the configured FROM address in env if not provided */
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  /** Provider-assigned message ID for tracing */
  messageId: string;
  success: boolean;
}

/**
 * Interface for all email delivery services.
 *
 * Implementations:
 * - `ResendEmailAdapter` — primary (Resend API)
 * - `NodemailerAdapter` — fallback (SMTP) — future
 *
 * Security note: never log email bodies or attachment content in server logs.
 */
export interface IEmailAdapter {
  /**
   * Send a single transactional email.
   * @throws {EmailDeliveryError} if the provider returns an error
   */
  send(options: EmailOptions): Promise<EmailResult>;

  /**
   * Send a batch of emails (e.g., bulk notifications).
   * Results array is index-aligned with the input messages array.
   */
  sendBatch(messages: EmailOptions[]): Promise<EmailResult[]>;
}

/** Thrown when an email delivery provider returns an error response */
export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly providerCode?: string,
    public readonly recipient?: string,
  ) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}
