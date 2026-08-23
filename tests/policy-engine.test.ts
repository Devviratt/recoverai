import { describe, it, expect } from 'vitest';
import { checkPolicy, type PolicyCheckContext } from '../src/lib/engines/policy-engine';
import type { PaymentContext } from '../src/lib/types';

describe('Policy / Guardrail Engine', () => {
  const baseContext: PaymentContext = {
    paymentId: 'pay_test_002',
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
    customerSegment: 'regular',
    customerLifetimeValue: 15000,
    totalTransactions: 9,
  };

  const basePolicyCtx: PolicyCheckContext = {
    paymentContext: baseContext,
    recommendedAction: 'PAYMENT_LINK',
    aiConfidence: 0.85,
    currentRetryCount: 0,
    currentRecoveryAttempts: 0,
    lastCustomerContactHoursAgo: null,
    notificationsSent: 0,
    hasActiveRecoveryAction: false,
    paymentLinkExpired: false,
  };

  it('should approve valid recovery actions passing all guardrails', () => {
    const result = checkPolicy(basePolicyCtx);
    expect(result.allowed).toBe(true);
    expect(result.rule).toBe('ALL_PASSED');
  });

  it('should block retries exceeding max retries limit (3)', () => {
    const ctx = {
      ...basePolicyCtx,
      recommendedAction: 'RETRY' as const,
      currentRetryCount: 3,
    };
    const result = checkPolicy(ctx);
    expect(result.allowed).toBe(false);
    expect(result.rule).toBe('MAX_RETRIES');
  });

  it('should block automatic action for high-value transactions (> ₹50,000)', () => {
    const ctx = {
      ...basePolicyCtx,
      paymentContext: { ...baseContext, amount: 75000 },
      recommendedAction: 'PAYMENT_LINK' as const,
    };
    const result = checkPolicy(ctx);
    expect(result.allowed).toBe(false);
    expect(result.rule).toBe('HIGH_VALUE_ESCALATION');
  });

  it('should block actions when AI confidence is below minimum threshold (< 60%)', () => {
    const ctx = {
      ...basePolicyCtx,
      aiConfidence: 0.45,
    };
    const result = checkPolicy(ctx);
    expect(result.allowed).toBe(false);
    expect(result.rule).toBe('LOW_CONFIDENCE_ESCALATION');
  });

  it('should block suspected fraud transactions from automatic recovery', () => {
    const ctx = {
      ...basePolicyCtx,
      paymentContext: { ...baseContext, failureReason: 'suspected_fraud' },
    };
    const result = checkPolicy(ctx);
    expect(result.allowed).toBe(false);
    expect(result.rule).toBe('FRAUD_GUARD');
  });

  it('should ALWAYS allow safety actions ESCALATE and STOP', () => {
    const escalateResult = checkPolicy({ ...basePolicyCtx, recommendedAction: 'ESCALATE' });
    const stopResult = checkPolicy({ ...basePolicyCtx, recommendedAction: 'STOP' });

    expect(escalateResult.allowed).toBe(true);
    expect(stopResult.allowed).toBe(true);
  });
});
