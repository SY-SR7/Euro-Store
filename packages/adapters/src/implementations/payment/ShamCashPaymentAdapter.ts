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
 * Stub implementation of IPaymentAdapter for Sham Cash payment gateway in the Syrian market.
 * TBD: Pending official API documentation and credentials.
 * See _handoff/ARCHITECTURE_DECISIONS.md ADR-003 for context.
 */
export class ShamCashPaymentAdapter implements IPaymentAdapter {
  constructor(private readonly config: { apiKey: string; apiUrl: string; webhookSecret: string }) {}

  async initiatePayment(params: PaymentInitiateParams): Promise<PaymentResult> {
    await Promise.resolve();
    console.warn(`[ShamCash STUB] initiatePayment called for API ${this.config.apiUrl} — returning mock response`);
    return {
      success: true,
      transactionId: `STUB-${Date.now()}`,
      status: 'pending',
      rawResponse: { stub: true, orderId: params.orderId },
    };
  }

  async verifyPayment(params: PaymentVerifyParams): Promise<PaymentResult> {
    await Promise.resolve();
    console.warn('[ShamCash STUB] verifyPayment called — returning mock paid response');
    return { success: true, transactionId: params.transactionId, status: 'paid' };
  }

  async validateWebhook(_headers: Record<string, string>, _body: string): Promise<WebhookValidationResult> {
    await Promise.resolve();
    console.warn('[ShamCash STUB] validateWebhook called — returning valid=true');
    return { valid: true };
  }

  async refund(transactionId: string, _amount_syp: bigint): Promise<PaymentResult> {
    await Promise.resolve();
    console.warn('[ShamCash STUB] refund called — returning mock response');
    return { success: true, transactionId, status: 'refunded' };
  }
}
