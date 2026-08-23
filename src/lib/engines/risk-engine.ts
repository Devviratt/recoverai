// ─── RecoverAI Risk Engine ──────────────────────────────────────────────────────
// Deterministic Revenue Risk Scoring
//
// Scoring Formula:
//   risk_score = Σ(weight_i × normalized_factor_i) × 100
//
// Factors:
//   1. Amount Factor     — higher amounts = higher risk (log-scaled, capped at ₹1,50,000)
//   2. History Factor    — lower customer success rate = higher risk
//   3. Failure Factor    — certain failure reasons are more recoverable
//   4. Recency Factor    — recent failures are more urgent
//   5. Retry Factor      — more retries = higher risk of permanent failure
//   6. Segment Factor    — premium/enterprise customers = higher priority
//
// All weights are configurable. The default config is tuned for Indian
// e-commerce / SaaS payment patterns.

import type { PaymentContext, RiskScoreResult, RiskFactor, RiskEngineConfig, Priority } from '@/lib/types';

// ─── Default Configuration ──────────────────────────────────────────────────────

export const DEFAULT_RISK_CONFIG: RiskEngineConfig = {
  amountWeight: 0.20,
  historyWeight: 0.25,
  failureWeight: 0.20,
  recencyWeight: 0.15,
  retryWeight: 0.10,
  segmentWeight: 0.10,
  highValueThreshold: 50000,
};

// ─── Failure Category Scores ────────────────────────────────────────────────────
// Higher score = more likely to be recoverable (= higher risk of revenue loss if not acted on)

const FAILURE_RECOVERABILITY: Record<string, number> = {
  insufficient_funds: 0.85,        // Very likely recoverable — customer may have funds later
  bank_timeout: 0.80,              // Transient — likely to succeed on retry
  network_error: 0.75,             // Transient — infrastructure issue
  authentication_failed: 0.60,     // May need customer action
  daily_limit_exceeded: 0.70,      // Customer can pay next day
  card_declined: 0.50,             // Could be many reasons
  international_card_blocked: 0.40, // May need alt payment method
  invalid_card: 0.30,              // Customer needs new card
  card_expired: 0.25,              // Customer needs new card
  technical_error: 0.65,           // Transient system issue
  suspected_fraud: 0.10,           // Should NOT auto-recover
  account_closed: 0.05,            // Unrecoverable
};

// ─── Main Scoring Function ──────────────────────────────────────────────────────

export function calculateRiskScore(
  context: PaymentContext,
  config: RiskEngineConfig = DEFAULT_RISK_CONFIG
): RiskScoreResult {
  const factors: RiskFactor[] = [];

  // 1. Amount Factor — log-scaled normalization
  const amountNorm = Math.min(Math.log(context.amount + 1) / Math.log(150001), 1);
  factors.push({
    name: 'Payment Amount',
    weight: config.amountWeight,
    rawValue: context.amount,
    normalizedValue: amountNorm,
    contribution: config.amountWeight * amountNorm,
  });

  // 2. History Factor — inverse of customer success rate
  // A customer with high success rate failing is a bigger recovery opportunity
  const historyScore = context.customerSuccessRate; // High success = high recoverability
  factors.push({
    name: 'Customer History',
    weight: config.historyWeight,
    rawValue: context.customerSuccessRate,
    normalizedValue: historyScore,
    contribution: config.historyWeight * historyScore,
  });

  // 3. Failure Category Factor
  const failureScore = FAILURE_RECOVERABILITY[context.failureReason] ?? 0.5;
  factors.push({
    name: 'Failure Recoverability',
    weight: config.failureWeight,
    rawValue: failureScore,
    normalizedValue: failureScore,
    contribution: config.failureWeight * failureScore,
  });

  // 4. Recency Factor — exponential decay, recent failures score higher
  const recencyScore = Math.exp(-context.hoursSinceFailure / 48); // half-life ~33 hours
  factors.push({
    name: 'Recency',
    weight: config.recencyWeight,
    rawValue: context.hoursSinceFailure,
    normalizedValue: recencyScore,
    contribution: config.recencyWeight * recencyScore,
  });

  // 5. Retry Factor — fewer retries = more room to act
  const retryScore = 1 - Math.min(context.retryCount / 3, 1);
  factors.push({
    name: 'Retry Headroom',
    weight: config.retryWeight,
    rawValue: context.retryCount,
    normalizedValue: retryScore,
    contribution: config.retryWeight * retryScore,
  });

  // 6. Segment Factor
  const segmentScores: Record<string, number> = {
    enterprise: 1.0,
    premium: 0.8,
    regular: 0.5,
  };
  const segmentScore = segmentScores[context.customerSegment] ?? 0.5;
  factors.push({
    name: 'Customer Segment',
    weight: config.segmentWeight,
    rawValue: segmentScore,
    normalizedValue: segmentScore,
    contribution: config.segmentWeight * segmentScore,
  });

  // Calculate total score
  const totalContribution = factors.reduce((sum, f) => sum + f.contribution, 0);
  const riskScore = Math.round(Math.min(totalContribution * 100, 100));

  // Determine priority
  const priority = getPriority(riskScore, context.amount, config.highValueThreshold);

  return {
    riskScore,
    priority,
    revenueAtRisk: context.amount,
    factors,
  };
}

// ─── Priority Calculation ──────────────────────────────────────────────────────

function getPriority(score: number, amount: number, highValueThreshold: number): Priority {
  // High-value transactions get escalated priority
  if (amount >= highValueThreshold) return 'CRITICAL';
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

// ─── Utility: Get failure recoverability description ───────────────────────────

export function getFailureDescription(reason: string): string {
  const descriptions: Record<string, string> = {
    insufficient_funds: 'Customer had insufficient balance — likely temporary',
    card_declined: 'Card was declined by issuing bank',
    bank_timeout: 'Bank did not respond in time — transient issue',
    authentication_failed: 'Customer failed authentication (3DS/OTP)',
    invalid_card: 'Card details are invalid or incorrect',
    card_expired: 'Card has expired — customer needs a new card',
    network_error: 'Network connectivity issue — transient',
    international_card_blocked: 'International transactions blocked on card',
    daily_limit_exceeded: 'Customer hit daily transaction limit',
    suspected_fraud: 'Transaction flagged as potentially fraudulent',
    account_closed: 'Customer bank account is closed',
    technical_error: 'System technical error — transient',
  };
  return descriptions[reason] ?? 'Unknown failure reason';
}
