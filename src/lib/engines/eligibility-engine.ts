// ─── RecoverAI Eligibility Engine ──────────────────────────────────────────────
// Determines whether a failed payment is eligible for automated recovery.

export interface EligibilityContext {
  paymentStatus: string;
  failureReason: string;
  hoursSinceFailure: number;
  isAlreadyRecovered: boolean;
  hasActiveRecovery: boolean;
  customerOptedOut: boolean;
  paymentAmount: number;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
  ineligibilityReasons: string[];
}

// ─── Configuration ──────────────────────────────────────────────────────────────

const MAX_RECOVERY_WINDOW_HOURS = 168; // 7 days
const MIN_RECOVERY_AMOUNT = 10; // ₹10 minimum

// Failure reasons that are never eligible for automated recovery
const INELIGIBLE_FAILURE_REASONS = ['suspected_fraud', 'account_closed'];

// ─── Main Eligibility Check ─────────────────────────────────────────────────────

export function checkEligibility(ctx: EligibilityContext): EligibilityResult {
  const reasons: string[] = [];

  // Must be a failed payment
  if (ctx.paymentStatus !== 'failed') {
    reasons.push(`Payment status is "${ctx.paymentStatus}" — only failed payments are eligible.`);
  }

  // Must not already be recovered
  if (ctx.isAlreadyRecovered) {
    reasons.push('Payment has already been recovered.');
  }

  // Must not have an active recovery in progress
  if (ctx.hasActiveRecovery) {
    reasons.push('An active recovery is already in progress for this payment.');
  }

  // Must be within recovery window
  if (ctx.hoursSinceFailure > MAX_RECOVERY_WINDOW_HOURS) {
    reasons.push(`Payment failed ${ctx.hoursSinceFailure.toFixed(0)} hours ago — exceeds ${MAX_RECOVERY_WINDOW_HOURS}-hour recovery window.`);
  }

  // Must not be an ineligible failure reason
  if (INELIGIBLE_FAILURE_REASONS.includes(ctx.failureReason)) {
    reasons.push(`Failure reason "${ctx.failureReason}" is not eligible for automated recovery.`);
  }

  // Customer must not have opted out
  if (ctx.customerOptedOut) {
    reasons.push('Customer has opted out of recovery communications.');
  }

  // Minimum amount
  if (ctx.paymentAmount < MIN_RECOVERY_AMOUNT) {
    reasons.push(`Payment amount ₹${ctx.paymentAmount} is below minimum recovery threshold (₹${MIN_RECOVERY_AMOUNT}).`);
  }

  return {
    eligible: reasons.length === 0,
    reason: reasons.length === 0
      ? 'Payment is eligible for automated recovery.'
      : `Payment is not eligible: ${reasons[0]}`,
    ineligibilityReasons: reasons,
  };
}
