// ─── Recovery Strategy Engine & Expected Recovery Value Tests ───────────────────
// Tests deterministic probability estimation, expected value calculations,
// customer context sensitivity, and Hero Scenario D reproducibility.

import { describe, it, expect } from 'vitest';
import {
  evaluateRecoveryStrategies,
  simulateWhatIfRecovery,
  calculateBaselineRecovery,
} from '../src/lib/engines/recovery-strategy-engine';
import type { PaymentContext } from '../src/lib/types';

describe('Recovery Strategy Engine', () => {
  const baseContext: PaymentContext = {
    paymentId: 'pay_test_001',
    orderId: 'order_test_001',
    amount: 4999,
    currency: 'INR',
    status: 'failed',
    failureReason: 'card_declined',
    paymentMethod: 'card',
    customerSuccessRate: 0.80,
    previousFailures: 2,
    previousSuccesses: 8,
    retryCount: 0,
    hoursSinceFailure: 2,
    customerSegment: 'premium',
    customerLifetimeValue: 38000,
    totalTransactions: 10,
  };

  it('should evaluate candidate strategies and calculate expected recovery values', () => {
    const comparison = evaluateRecoveryStrategies(baseContext);

    expect(comparison.candidates.length).toBe(6); // RETRY, PAYMENT_LINK, REMINDER, ALT_METHOD, ESCALATE, STOP
    expect(comparison.recommendedAction).toBe('PAYMENT_LINK');
    expect(comparison.highestExpectedRecovery).toBeGreaterThan(comparison.baselineExpectedRecovery);
  });

  it('CORRECTION 6 PROOF: changing customer history alters calculated strategy values', () => {
    const highTierContext: PaymentContext = { ...baseContext, customerSuccessRate: 0.90 };
    const lowTierContext: PaymentContext = { ...baseContext, customerSuccessRate: 0.20 };

    const highResult = evaluateRecoveryStrategies(highTierContext);
    const lowResult = evaluateRecoveryStrategies(lowTierContext);

    const highPaymentLink = highResult.candidates.find((c) => c.action === 'PAYMENT_LINK')!;
    const lowPaymentLink = lowResult.candidates.find((c) => c.action === 'PAYMENT_LINK')!;

    // Higher customer success rate must yield higher estimated recovery probability & expected recovery
    expect(highPaymentLink.estimatedRecoveryProbability).toBeGreaterThan(lowPaymentLink.estimatedRecoveryProbability);
    expect(highPaymentLink.expectedRecovery).toBeGreaterThan(lowPaymentLink.expectedRecovery);
  });

  it('CORRECTION 6 PROOF: changing failure reason alters candidate eligibility and values', () => {
    const fraudContext: PaymentContext = { ...baseContext, failureReason: 'suspected_fraud' };
    const timeoutContext: PaymentContext = { ...baseContext, failureReason: 'bank_timeout' };

    const fraudResult = evaluateRecoveryStrategies(fraudContext);
    const timeoutResult = evaluateRecoveryStrategies(timeoutContext);

    const fraudRetry = fraudResult.candidates.find((c) => c.action === 'RETRY')!;
    const timeoutRetry = timeoutResult.candidates.find((c) => c.action === 'RETRY')!;

    // Fraud must render RETRY ineligible, while bank_timeout makes RETRY eligible with high probability
    expect(fraudRetry.eligible).toBe(false);
    expect(timeoutRetry.eligible).toBe(true);
    expect(timeoutRetry.estimatedRecoveryProbability).toBeGreaterThan(0.60);
  });

  it('CORRECTION 7 PROOF: Hero Scenario D is 100% reproducible across multiple runs with deterministic input', () => {
    const scenarioDContext: PaymentContext = {
      paymentId: 'pay_hero_scenario_d',
      orderId: 'order_hero_d',
      amount: 4999,
      currency: 'INR',
      status: 'failed',
      failureReason: 'card_declined',
      paymentMethod: 'card',
      customerSuccessRate: 0.80,
      previousFailures: 2,
      previousSuccesses: 8,
      retryCount: 0,
      hoursSinceFailure: 3,
      customerSegment: 'premium',
      customerLifetimeValue: 38000,
      totalTransactions: 10,
    };

    const run1 = evaluateRecoveryStrategies(scenarioDContext);
    const run2 = evaluateRecoveryStrategies(scenarioDContext);
    const run3 = evaluateRecoveryStrategies(scenarioDContext);

    expect(run1.recommendedAction).toBe('PAYMENT_LINK');
    expect(run1.highestExpectedRecovery).toEqual(run2.highestExpectedRecovery);
    expect(run2.highestExpectedRecovery).toEqual(run3.highestExpectedRecovery);
    expect(run1.candidates).toEqual(run2.candidates);
  });

  it('should generate valid what-if simulation results for Case Detail UI', () => {
    const whatIf = simulateWhatIfRecovery(baseContext);

    expect(whatIf.bestStrategy).toBe('PAYMENT_LINK');
    expect(whatIf.expectedIncrementalRecovery).toBeGreaterThan(0);
    expect(whatIf.recoveryValueLiftPercent).toBeGreaterThan(0);
  });
});
