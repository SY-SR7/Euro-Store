/**
 * @eurostore/adapters — IPaymentAdapter
 *
 * Interface for payment gateway integrations.
 * Business logic NEVER calls payment SDKs directly — always through this interface.
 *
 * Current implementation: ShamCashPaymentAdapter (STUB — API docs TBD)
 * Future: StripeAdapter (v2 — international expansion)
 *
 * [TBD] Sham Cash API documentation not yet received.
 * See _handoff/ARCHITECTURE_DECISIONS.md ADR-003 for context.
 *
 * SECURITY CRITICAL:
 * - amountSYP is bigint (whole Syrian Pounds, no decimals) — matches DB column type
 * - All payment amounts must be verified server-side — never trust client-reported amounts
 * - Webhook signatures must be validated before processing any payment status update
 * - No payment data (card numbers, tokens) is ever stored in our DB
 */

export interface PaymentInitiateParams {
  /** UUID of the order in our database */
  orderId: string;
  /** Human-readable order number (e.g., "ORD-2026-00042") */
  orderNumber: string;
  /** Amount in whole Syrian Pounds (bigint — no decimals) */
  amountSYP: bigint;
  /** Syrian phone number in E.164 format (+963...) */
  customerPhone: string;
  customerName: string;
  /** Short description shown to the customer in the payment UI */
  description: string;
  /**
   * URL to redirect the customer after payment completion.
   * Must be an allowlisted domain — never accept from client input.
   */
  callbackUrl: string;
  /**
   * Server-to-server webhook URL for async payment status updates.
   * Must be a server-side route, not exposed to the client.
   */
  webhookUrl: string;
}

export interface PaymentResult {
  success: boolean;
  /** Provider-assigned transaction identifier */
  transactionId?: string;
  /** Redirect URL if the gateway uses a hosted payment page */
  paymentUrl?: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  /**
   * Raw provider response for debugging — never expose to client.
   * Log server-side only (masked).
   */
  rawResponse?: unknown;
}

export interface PaymentVerifyParams {
  /** Provider-assigned transaction ID from initiatePayment result */
  transactionId: string;
  /** Our internal order ID to cross-verify the transaction */
  orderId: string;
  /** Expected amount — must match what we initiated, not what the client claims */
  amountSYP: bigint;
}

export interface WebhookValidationResult {
  /** Whether the webhook signature is cryptographically valid */
  valid: boolean;
  /** Provider's transaction ID extracted from the validated payload */
  transactionId?: string;
  /** Payment status from the webhook payload */
  status?: 'paid' | 'failed' | 'refunded';
}

/**
 * Interface for payment gateway integrations.
 *
 * Implementations:
 * - `ShamCashPaymentAdapter` — [TBD STUB] Syrian market gateway
 * - `StripeAdapter` — future (international)
 *
 * Security requirements:
 * 1. validateWebhook() MUST be called before processing any webhook event
 * 2. verifyPayment() MUST cross-check the amount server-side before fulfilling an order
 * 3. refund() requires an audit log entry in the caller — this interface does not log
 * 4. All rawResponse fields must be stripped before any client-facing response
 */
export interface IPaymentAdapter {
  /**
   * Initiate a payment flow. Returns a pending transaction and optionally a redirect URL.
   * Called server-side only — never from client code.
   */
  initiatePayment(params: PaymentInitiateParams): Promise<PaymentResult>;

  /**
   * Verify a payment's status with the provider.
   * Always verify before marking an order as paid — never trust webhook alone.
   */
  verifyPayment(params: PaymentVerifyParams): Promise<PaymentResult>;

  /**
   * Validate an incoming webhook's HMAC/signature before processing.
   * Must be the FIRST thing called in a webhook handler route.
   *
   * @param headers - Raw request headers (lowercase keys)
   * @param body - Raw request body string (before JSON.parse — for signature verification)
   */
  validateWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookValidationResult>;

  /**
   * Issue a full or partial refund.
   * Caller is responsible for writing an audit log entry before/after calling this.
   */
  refund(transactionId: string, amountSYP: bigint): Promise<PaymentResult>;
}

/** Thrown when a payment operation fails at the provider level */
export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public readonly providerCode?: string,
    public readonly transactionId?: string,
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

/** Thrown when a webhook signature validation fails */
export class WebhookSignatureError extends Error {
  constructor(message = 'Invalid webhook signature') {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}
