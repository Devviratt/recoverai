// ─── RecoverAI Stopping Rules ──────────────────────────────────────────────────
// Explicit conditions under which the system stops automated recovery.
// Every stopped case records WHY it was stopped.
//
// These rules are critical for bounded autonomy and are displayed
// prominently in the Agent Trace and Case Detail UI.

import type { StoppingRuleResult } from '@/lib/types';

// ─── Stopping Rule Context ──────────────────────────────────────────────────────

export interface StoppingContext {
  recoveryAttempts: number;
  maxAttempts: number;
  isRecovered: boolean;
  aiConfidence: number;
  consecutiveFailures: number;
  customerRecentFailures: number; // failures in last 30 days
  paymentLinkExpired: boolean;
  hasCompliantActionRemaining: boolean;
  isManualStop: boolean;
  lastActionResult: 'SUCCESS' | 'FAILED' | 'PENDING' | null;
}

// ─── Stopping Rule Interface ────────────────────────────────────────────────────

interface StoppingRule {
  id: string;
  name: string;
  description: string;
  check: (ctx: StoppingContext) => boolean;
  reason: string;
}

// ─── Stopping Rules ────────────────────────────────────────────────────────────

export const STOPPING_RULES: StoppingRule[] = [
  {
    id: 'SUCCESSFUL_RECOVERY',
    name: 'Successful Recovery',
    description: 'Stop after payment is successfully recovered',
    check: (ctx) => ctx.isRecovered,
    reason: 'Payment successfully recovered. No further action needed.',
  },
  {
    id: 'MAX_ATTEMPTS_REACHED',
    name: 'Maximum Attempts Reached',
    description: 'Stop after maximum automated interventions (default: 3)',
    check: (ctx) => ctx.recoveryAttempts >= ctx.maxAttempts,
    reason: 'Maximum automated recovery attempts reached.',
  },
  {
    id: 'LOW_CONFIDENCE_REPEATED',
    name: 'Low Confidence After Failures',
    description: 'Stop if AI confidence drops below threshold after repeated failures',
    check: (ctx) => ctx.aiConfidence < 0.4 && ctx.consecutiveFailures >= 2,
    reason: 'AI confidence too low after repeated failed recovery attempts.',
  },
  {
    id: 'CUSTOMER_REPEATED_FAILURES',
    name: 'Customer Repeated Failures',
    description: 'Stop if customer has too many recent consecutive failure attempts',
    check: (ctx) => ctx.consecutiveFailures >= 3 || (ctx.customerRecentFailures > 30 && ctx.recoveryAttempts >= 2),
    reason: 'Customer has too many recent payment failures. Further automated contact inappropriate.',
  },
  {
    id: 'PAYMENT_LINK_EXPIRED',
    name: 'Payment Link Expired',
    description: 'Stop if payment link expired without payment',
    check: (ctx) => ctx.paymentLinkExpired && ctx.lastActionResult !== 'SUCCESS',
    reason: 'Recovery payment link expired without customer action.',
  },
  {
    id: 'NO_COMPLIANT_ACTION',
    name: 'No Compliant Action Remaining',
    description: 'Stop when no policy-compliant recovery action is available',
    check: (ctx) => !ctx.hasCompliantActionRemaining,
    reason: 'No policy-compliant recovery actions remain for this payment.',
  },
  {
    id: 'MANUAL_STOP',
    name: 'Manual Stop',
    description: 'Stop by operator/merchant decision',
    check: (ctx) => ctx.isManualStop,
    reason: 'Recovery stopped by operator decision.',
  },
];

// ─── Main Stopping Check ────────────────────────────────────────────────────────

export function checkStoppingRules(ctx: StoppingContext): StoppingRuleResult {
  for (const rule of STOPPING_RULES) {
    if (rule.check(ctx)) {
      return {
        shouldStop: true,
        rule: rule.id,
        reason: rule.reason,
      };
    }
  }

  return { shouldStop: false };
}

// ─── Utility: Get all stopping rules for display ──────────────────────────────

export function getStoppingRulesDisplay(): { id: string; name: string; description: string }[] {
  return STOPPING_RULES.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
  }));
}
