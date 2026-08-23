// ─── RecoverAI Payment Provider Factory ─────────────────────────────────────────

import type { PaymentProviderInterface } from '@/lib/types';
import { MockPaymentProvider } from '@/lib/providers/mock-provider';
import { RazorpayTestProvider } from '@/lib/providers/razorpay-provider';

let cachedProvider: PaymentProviderInterface | null = null;

export function getPaymentProvider(): PaymentProviderInterface {
  if (cachedProvider) return cachedProvider;

  const provider = process.env.PAYMENT_PROVIDER || 'mock';

  switch (provider) {
    case 'razorpay': {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        console.warn('[PaymentProvider] Razorpay credentials not set, falling back to mock');
        cachedProvider = new MockPaymentProvider();
      } else {
        cachedProvider = new RazorpayTestProvider(keyId, keySecret);
      }
      break;
    }
    case 'mock':
    default:
      cachedProvider = new MockPaymentProvider();
      break;
  }

  console.log(`[PaymentProvider] Using: ${cachedProvider.providerName} (test mode: ${cachedProvider.isTestMode})`);
  return cachedProvider;
}

export function resetPaymentProvider(): void {
  cachedProvider = null;
}
