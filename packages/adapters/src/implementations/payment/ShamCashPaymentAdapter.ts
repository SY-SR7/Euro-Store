import type {
  IPaymentAdapter,
  PaymentInitiateParams,
  PaymentResult,
  PaymentVerifyParams,
  WebhookValidationResult,
} from '../../interfaces/IPaymentAdapter';

/**
 * @eurostore/adapters — ShamCashPaymentAdapter (STUB)
 *
 * Fail-closed implementation for the Sham Cash payment gateway in the Syrian market.
 * TBD: Pending official API documentation and credentials.
 * See _handoff/ARCHITECTURE_DECISIONS.md ADR-003 for context.
 */
export class ShamCashPaymentAdapter implements IPaymentAdapter {
  constructor(private readonly config: { apiKey: string; apiUrl: string; webhookSecret: string }) {}

  async initiatePayment(_params: PaymentInitiateParams): Promise<PaymentResult> {
    await Promise.resolve();
    console.warn(`Sham Cash payment is not configured for API ${this.config.apiUrl}.`);
    return {
      success: false,
      status: 'failed',
    };
  }

  async verifyPayment(_params: PaymentVerifyParams): Promise<PaymentResult> {
    await Promise.resolve();
    console.warn('Sham Cash payment verification is not configured.');
    return { success: false, status: 'failed' };
  }

  async validateWebhook(_headers: Record<string, string>, _body: string): Promise<WebhookValidationResult> {
    await Promise.resolve();
    console.warn('Sham Cash webhook validation is not configured.');
    return { valid: false };
  }

  async refund(_transactionId: string, _amount_syp: bigint): Promise<PaymentResult> {
    await Promise.resolve();
    console.warn('Sham Cash refund is not configured.');
    return { success: false, status: 'failed' };
  }
}
