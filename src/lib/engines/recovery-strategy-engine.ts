// ─── RecoverAI Recovery Strategy Engine ─────────────────────────────────────────
// Calculates estimated recovery probability, expected recovery amount (INR),
// expected incremental recovery (vs baseline), and evaluates candidate strategies.

import {
  PaymentContext,
  RecoveryActionType,
  StrategyCandidate,
  StrategyComparison,
  WhatIfSimulationResult,
} from '../types';

// Base recoverability matrix by failure reason and strategy
const STRATEGY_BASE_PROBABILITIES: Record<string, Record<RecoveryActionType, number>> = {
  bank_timeout: {
    RETRY: 0.75,
    PAYMENT_LINK: 0.85,
    REMINDER: 0.40,
    ALT_METHOD: 0.70,
    ESCALATE: 0.80,
    STOP: 0.0,
  },
  network_error: {
    RETRY: 0.70,
    PAYMENT_LINK: 0.82,
    REMINDER: 0.38,
    ALT_METHOD: 0.68,
    ESCALATE: 0.78,
    STOP: 0.0,
  },
  insufficient_funds: {
    RETRY: 0.35,
    PAYMENT_LINK: 0.76,
    REMINDER: 0.45,
    ALT_METHOD: 0.60,
    ESCALATE: 0.65,
    STOP: 0.0,
  },
  card_declined: {
    RETRY: 0.38,
    PAYMENT_LINK: 0.74,
    REMINDER: 0.35,
    ALT_METHOD: 0.72,
    ESCALATE: 0.70,
    STOP: 0.0,
  },
  authentication_failed: {
    RETRY: 0.42,
    PAYMENT_LINK: 0.78,
    REMINDER: 0.40,
    ALT_METHOD: 0.68,
    ESCALATE: 0.72,
    STOP: 0.0,
  },
  card_expired: {
    RETRY: 0.05,
    PAYMENT_LINK: 0.65,
    REMINDER: 0.30,
    ALT_METHOD: 0.82,
    ESCALATE: 0.60,
    STOP: 0.0,
  },
  invalid_card: {
    RETRY: 0.05,
    PAYMENT_LINK: 0.62,
    REMINDER: 0.25,
    ALT_METHOD: 0.80,
    ESCALATE: 0.58,
    STOP: 0.0,
  },
  international_card_blocked: {
    RETRY: 0.10,
    PAYMENT_LINK: 0.68,
    REMINDER: 0.30,
    ALT_METHOD: 0.84,
    ESCALATE: 0.65,
    STOP: 0.0,
  },
  daily_limit_exceeded: {
    RETRY: 0.20,
    PAYMENT_LINK: 0.72,
    REMINDER: 0.55,
    ALT_METHOD: 0.65,
    ESCALATE: 0.68,
    STOP: 0.0,
  },
  suspected_fraud: {
    RETRY: 0.0,
    PAYMENT_LINK: 0.0,
    REMINDER: 0.0,
    ALT_METHOD: 0.0,
    ESCALATE: 0.85,
    STOP: 0.0,
  },
  account_closed: {
    RETRY: 0.0,
    PAYMENT_LINK: 0.0,
    REMINDER: 0.0,
    ALT_METHOD: 0.0,
    ESCALATE: 0.10,
    STOP: 0.0,
  },
  technical_error: {
    RETRY: 0.65,
    PAYMENT_LINK: 0.80,
    REMINDER: 0.35,
    ALT_METHOD: 0.65,
    ESCALATE: 0.75,
    STOP: 0.0,
  },
};

const BASELINE_NATURAL_RECOVERY_RATES: Record<string, number> = {
  bank_timeout: 0.22,
  network_error: 0.20,
  insufficient_funds: 0.12,
  card_declined: 0.10,
  authentication_failed: 0.15,
  card_expired: 0.02,
  invalid_card: 0.02,
  international_card_blocked: 0.04,
  daily_limit_exceeded: 0.15,
  suspected_fraud: 0.00,
  account_closed: 0.00,
  technical_error: 0.18,
};

const OPERATIONAL_COSTS: Record<RecoveryActionType, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  RETRY: 'LOW',
  PAYMENT_LINK: 'LOW',
  REMINDER: 'LOW',
  ALT_METHOD: 'MEDIUM',
  ESCALATE: 'HIGH',
  STOP: 'LOW',
};

/**
 * Calculates deterministic Baseline Natural Recovery (no-intelligence/no-agent baseline)
 */
export function calculateBaselineRecovery(ctx: PaymentContext): number {
  const baseRate = BASELINE_NATURAL_RECOVERY_RATES[ctx.failureReason] ?? 0.10;
  const historyFactor = 0.5 + ctx.customerSuccessRate * 0.5;
  const retryPenalty = ctx.retryCount > 0 ? Math.pow(0.5, ctx.retryCount) : 1.0;
  const baselineProb = Math.min(0.85, Math.max(0.0, baseRate * historyFactor * retryPenalty));
  return Math.round(ctx.amount * baselineProb);
}

/**
 * Evaluates all candidate recovery strategies for a given payment context.
 * Computes estimated recovery probability, expected recovery amount (INR),
 * and expected incremental recovery (vs baseline).
 */
export function evaluateRecoveryStrategies(ctx: PaymentContext): StrategyComparison {
  const baselineExpectedRecovery = calculateBaselineRecovery(ctx);
  const candidates: StrategyCandidate[] = [];

  const actions: RecoveryActionType[] = ['RETRY', 'PAYMENT_LINK', 'REMINDER', 'ALT_METHOD', 'ESCALATE', 'STOP'];

  for (const action of actions) {
    let eligible = true;
    let ineligibilityReason: string | null = null;

    // Hard eligibility constraints based on failure semantics & retry history
    if (ctx.failureReason === 'suspected_fraud' && action !== 'ESCALATE' && action !== 'STOP') {
      eligible = false;
      ineligibilityReason = 'Suspected fraud payments must only be escalated or stopped.';
    } else if (ctx.failureReason === 'account_closed' && action !== 'STOP') {
      eligible = false;
      ineligibilityReason = 'Account closed payments cannot be recovered automatically.';
    } else if (action === 'RETRY' && ctx.retryCount >= 3) {
      eligible = false;
      ineligibilityReason = 'Maximum automated retry limit (3) reached.';
    } else if ((ctx.failureReason === 'card_expired' || ctx.failureReason === 'invalid_card') && action === 'RETRY') {
      eligible = false;
      ineligibilityReason = 'Expired/Invalid card cannot be retried directly.';
    }

    // Base probability lookup
    const reasonRates = STRATEGY_BASE_PROBABILITIES[ctx.failureReason] ?? STRATEGY_BASE_PROBABILITIES.card_declined;
    const baseProb = reasonRates[action];

    // Modifiers: customer history, retry penalty, amount scaling
    const customerModifier = (ctx.customerSuccessRate - 0.5) * 0.25;
    const retryPenalty = ctx.retryCount * 0.15;
    
    let prob = baseProb;
    if (action !== 'STOP') {
      prob = Math.max(0.0, Math.min(0.95, baseProb + customerModifier - retryPenalty));
    }

    if (!eligible) {
      prob = 0.0;
    }

    const expectedRecovery = Math.round(ctx.amount * prob);
    const expectedIncrementalRecovery = Math.max(0, expectedRecovery - baselineExpectedRecovery);

    // Confidence calculation (higher when probability or context is definitive)
    let confidence = 0.75;
    if (action === 'PAYMENT_LINK' && ctx.customerSuccessRate > 0.6) confidence = 0.90;
    else if (action === 'ESCALATE' && (ctx.amount >= 50000 || ctx.failureReason === 'suspected_fraud')) confidence = 0.92;
    else if (action === 'RETRY' && ctx.failureReason === 'bank_timeout') confidence = 0.85;

    candidates.push({
      action,
      estimatedRecoveryProbability: Math.round(prob * 100) / 100,
      expectedRecovery,
      expectedIncrementalRecovery,
      operationalCost: OPERATIONAL_COSTS[action],
      confidence: Math.round(confidence * 100) / 100,
      eligible,
      ineligibilityReason,
    });
  }

  // Select recommended action (eligible strategy with highest expected recovery)
  const eligibleCandidates = candidates.filter((c) => c.eligible);
  eligibleCandidates.sort((a, b) => b.expectedRecovery - a.expectedRecovery);

  const bestCandidate = eligibleCandidates[0] || candidates.find((c) => c.action === 'STOP') || candidates[0];

  const highestExpectedRecovery = bestCandidate.expectedRecovery;

  return {
    candidates,
    recommendedAction: bestCandidate.action,
    decisionReason: `Highest expected compliant recovery value (${bestCandidate.action}: ${Math.round(bestCandidate.estimatedRecoveryProbability * 100)}% estimated probability, ₹${bestCandidate.expectedRecovery.toLocaleString('en-IN')} expected recovery).`,
    baselineExpectedRecovery,
    highestExpectedRecovery,
  };
}

/**
 * Generates What-If Recovery Simulation for Case Detail UI & Benchmarks
 */
export function simulateWhatIfRecovery(ctx: PaymentContext): WhatIfSimulationResult {
  const comparison = evaluateRecoveryStrategies(ctx);
  const bestCandidate = comparison.candidates.find((c) => c.action === comparison.recommendedAction) || comparison.candidates[0];

  const incremental = Math.max(0, comparison.highestExpectedRecovery - comparison.baselineExpectedRecovery);
  const liftPercent = comparison.baselineExpectedRecovery > 0
    ? ((comparison.highestExpectedRecovery - comparison.baselineExpectedRecovery) / comparison.baselineExpectedRecovery) * 100
    : 100.0;

  return {
    paymentContext: ctx,
    baselineExpectedRecovery: comparison.baselineExpectedRecovery,
    candidates: comparison.candidates,
    bestStrategy: comparison.recommendedAction,
    expectedIncrementalRecovery: incremental,
    recoveryValueLiftPercent: Math.round(liftPercent * 10) / 10,
  };
}
