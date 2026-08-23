import { describe, it, expect } from 'vitest';
import { calculateRiskScore } from '../src/lib/engines/risk-engine';
import type { PaymentContext } from '../src/lib/types';

describe('Revenue Risk Engine', () => {
  const baseContext: PaymentContext = {
    paymentId: 'pay_test_001',
    amount: 2499,
    currency: 'INR',
    status: 'failed',
    failureReason: 'insufficient_funds',
    paymentMethod: 'card',
    customerSuccessRate: 0.85,
    previousFailures: 1,
    previousSuccesses: 8,
    retryCount: 0,
    hoursSinceFailure: 2,
    customerSegment: 'premium',
    customerLifetimeValue: 25000,
    totalTransactions: 9,
  };

  it('should calculate risk score between 0 and 100', () => {
    const result = calculateRiskScore(baseContext);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.priority).toBeDefined();
    expect(result.factors.length).toBe(6);
  });

  it('should assign CRITICAL priority for high-value transactions (> ₹50,000)', () => {
    const highValueContext = { ...baseContext, amount: 75000 };
    const result = calculateRiskScore(highValueContext);
    expect(result.priority).toBe('CRITICAL');
  });

  it('should decrease risk headroom score as retry count increases', () => {
    const zeroRetry = calculateRiskScore({ ...baseContext, retryCount: 0 });
    const maxRetry = calculateRiskScore({ ...baseContext, retryCount: 3 });

    const zeroFactor = zeroRetry.factors.find((f) => f.name === 'Retry Headroom')!;
    const maxFactor = maxRetry.factors.find((f) => f.name === 'Retry Headroom')!;

    expect(zeroFactor.normalizedValue).toBeGreaterThan(maxFactor.normalizedValue);
  });
});
