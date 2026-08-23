// ─── RecoverAI Razorpay Test Mode Provider ─────────────────────────────────────
// Uses official Razorpay API endpoints (https://api.razorpay.com/v1).
// All calls use Test Mode credentials — never live.
//
// Verified endpoints:
//   GET  /v1/payments/:id           — Fetch payment details
//   POST /v1/payment_links          — Create a standard payment link
//   GET  /v1/payment_links/:id      — Fetch payment link details
//   POST /v1/payment_links/:id/cancel — Cancel a payment link
//
// Authentication: HTTP Basic Auth (key_id:key_secret)
// Docs: https://razorpay.com/docs/api/payments/ & https://razorpay.com/docs/api/payment-links/

import type { PaymentProviderInterface, PaymentLinkParams, PaymentLinkResult } from '@/lib/types';

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

export class RazorpayTestProvider implements PaymentProviderInterface {
  readonly providerName = 'razorpay-test';
  readonly isTestMode = true;

  private keyId: string;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<unknown> {
    const url = `${RAZORPAY_BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      'Content-Type': 'application/json',
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Razorpay API error ${res.status}: ${errorText}`);
    }

    return res.json();
  }

  // GET /v1/payments/:id
  async getPayment(id: string): Promise<Record<string, unknown>> {
    const data = await this.request('GET', `/payments/${id}`);
    return data as Record<string, unknown>;
  }

  // POST /v1/payment_links
  // Docs: https://razorpay.com/docs/api/payments/payment-links/create-standard/
  async createRecoveryPaymentLink(params: PaymentLinkParams): Promise<PaymentLinkResult> {
    const body: Record<string, unknown> = {
      amount: Math.round(params.amount * 100), // Razorpay expects paise
      currency: params.currency,
      description: params.description,
      reference_id: params.referenceId,
      customer: {
        name: params.customerName,
        email: params.customerEmail,
        ...(params.customerPhone ? { contact: params.customerPhone } : {}),
      },
      notify: {
        email: params.notifyEmail ?? true,
        sms: params.notifySms ?? false,
      },
      reminder_enable: true,
      callback_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      callback_method: 'get',
    };

    if (params.expireBy) {
      body.expire_by = params.expireBy;
    }

    const data = (await this.request('POST', '/payment_links', body)) as Record<string, unknown>;

    return {
      id: data.id as string,
      shortUrl: data.short_url as string,
      status: data.status as string,
      amount: (data.amount as number) / 100, // Convert back to rupees
      currency: data.currency as string,
      expireBy: data.expire_by as number | undefined,
    };
  }

  // GET /v1/payment_links/:id
  async getPaymentLink(id: string): Promise<PaymentLinkResult> {
    const data = (await this.request('GET', `/payment_links/${id}`)) as Record<string, unknown>;

    return {
      id: data.id as string,
      shortUrl: data.short_url as string,
      status: data.status as string,
      amount: (data.amount as number) / 100,
      currency: data.currency as string,
      expireBy: data.expire_by as number | undefined,
    };
  }

  // POST /v1/payment_links/:id/cancel
  async cancelPaymentLink(id: string): Promise<void> {
    await this.request('POST', `/payment_links/${id}/cancel`);
  }
}
