// ─── RecoverAI Mock Payment Provider ────────────────────────────────────────────
// Full mock provider for demo mode — works without any credentials.
// All payment operations are simulated locally.

import type { PaymentProviderInterface, PaymentLinkParams, PaymentLinkResult } from '@/lib/types';

let linkCounter = 1000;

export class MockPaymentProvider implements PaymentProviderInterface {
  readonly providerName = 'mock';
  readonly isTestMode = true;

  async getPayment(id: string): Promise<Record<string, unknown>> {
    // Return a mock payment object
    return {
      id,
      entity: 'payment',
      amount: 249900,
      currency: 'INR',
      status: 'failed',
      method: 'card',
      description: 'Demo payment',
      error_code: 'BAD_REQUEST_ERROR',
      error_description: 'Payment failed',
      error_source: 'gateway',
      error_step: 'payment_authorization',
      error_reason: 'payment_failed',
    };
  }

  async createRecoveryPaymentLink(params: PaymentLinkParams): Promise<PaymentLinkResult> {
    linkCounter++;
    const linkId = `plink_mock_${linkCounter}`;
    const shortUrl = `https://rzp.io/demo/${linkId}`;

    return {
      id: linkId,
      shortUrl,
      status: 'created',
      amount: params.amount,
      currency: params.currency,
      expireBy: params.expireBy || Math.floor(Date.now() / 1000) + 86400,
    };
  }

  async getPaymentLink(id: string): Promise<PaymentLinkResult> {
    return {
      id,
      shortUrl: `https://rzp.io/demo/${id}`,
      status: 'created',
      amount: 0,
      currency: 'INR',
    };
  }

  async cancelPaymentLink(id: string): Promise<void> {
    // Mock cancellation — just log
    console.log(`[MockPaymentProvider] Cancelled payment link: ${id}`);
  }
}
