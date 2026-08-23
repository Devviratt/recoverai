// ─── RecoverAI Policy Engine ────────────────────────────────────────────────────
// Deterministic guardrail validation
//
// The LLM NEVER bypasses this engine. Every AI recommendation must pass through
// policy validation before execution.
//
// Architecture:
//   AI Recommendation → Policy Engine → Allowed/Rejected → Action Executor
//
// Rules are evaluated in order. First failing rule rejects the action.

import type {
  PolicyCheckResult,
  PolicyEngineConfig,
  RecoveryActionType,
  PaymentContext,
} from '@/lib/types';

// ─── Default Policy Configuration ──────────────────────────────────────────────

export const DEFAULT_POLICY_CONFIG: PolicyEngineConfig = {
  maxRetries: 3,
  maxRecoveryAttempts: 3,
  highValueThreshold: 50000,  // ₹50,000
  minConfidence: 0.6,
  customerCooldownHours: 24,
  maxNotifications: 2,
};

// ─── Policy Check Context ──────────────────────────────────────────────────────

export interface PolicyCheckContext {
  paymentContext: PaymentContext;
  recommendedAction: RecoveryActionType;
  aiConfidence: number;
  currentRetryCount: number;
  currentRecoveryAttempts: number;
  lastCustomerContactHoursAgo: number | null; // null if never contacted
  notificationsSent: number;
  hasActiveRecoveryAction: boolean;
  paymentLinkExpired: boolean;
}

// ─── Policy Rule Interface ─────────────────────────────────────────────────────

interface PolicyRule {
  name: string;
  description: string;
  check: (ctx: PolicyCheckContext, config: PolicyEngineConfig) => PolicyCheckResult | null;
}

// ─── Policy Rules ──────────────────────────────────────────────────────────────

const POLICY_RULES: PolicyRule[] = [
  {
    name: 'MAX_RETRIES',
    description: 'Never retry beyond the configured maximum',
    check: (ctx, config) => {
      if (ctx.recommendedAction === 'RETRY' && ctx.currentRetryCount >= config.maxRetries) {
        return {
          allowed: false,
          reason: `Maximum retry limit reached (${ctx.currentRetryCount}/${config.maxRetries}). Automated retries stopped.`,
          rule: 'MAX_RETRIES',
          details: { currentRetries: ctx.currentRetryCount, maxRetries: config.maxRetries },
        };
      }
      return null;
    },
  },
  {
    name: 'MAX_RECOVERY_ATTEMPTS',
    description: 'Maximum total automated recovery attempts per payment',
    check: (ctx, config) => {
      if (ctx.recommendedAction !== 'ESCALATE' && ctx.recommendedAction !== 'STOP') {
        if (ctx.currentRecoveryAttempts >= config.maxRecoveryAttempts) {
          return {
            allowed: false,
            reason: `Maximum recovery attempts reached (${ctx.currentRecoveryAttempts}/${config.maxRecoveryAttempts}). Further automation stopped.`,
            rule: 'MAX_RECOVERY_ATTEMPTS',
            details: { attempts: ctx.currentRecoveryAttempts, max: config.maxRecoveryAttempts },
          };
        }
      }
      return null;
    },
  },
  {
    name: 'HIGH_VALUE_ESCALATION',
    description: 'High-value transactions require human approval for automated actions',
    check: (ctx, config) => {
      if (
        ctx.paymentContext.amount >= config.highValueThreshold &&
        ctx.recommendedAction !== 'ESCALATE' &&
        ctx.recommendedAction !== 'STOP'
      ) {
        return {
          allowed: false,
          reason: `Payment amount ₹${ctx.paymentContext.amount.toLocaleString('en-IN')} exceeds high-value threshold (₹${config.highValueThreshold.toLocaleString('en-IN')}). Human approval required.`,
          rule: 'HIGH_VALUE_ESCALATION',
          details: { amount: ctx.paymentContext.amount, threshold: config.highValueThreshold },
        };
      }
      return null;
    },
  },
  {
    name: 'LOW_CONFIDENCE_ESCALATION',
    description: 'Low AI confidence requires human review',
    check: (ctx, config) => {
      if (
        ctx.aiConfidence < config.minConfidence &&
        ctx.recommendedAction !== 'ESCALATE' &&
        ctx.recommendedAction !== 'STOP'
      ) {
        return {
          allowed: false,
          reason: `AI confidence ${(ctx.aiConfidence * 100).toFixed(0)}% is below minimum threshold (${(config.minConfidence * 100).toFixed(0)}%). Human review required.`,
          rule: 'LOW_CONFIDENCE_ESCALATION',
          details: { confidence: ctx.aiConfidence, minConfidence: config.minConfidence },
        };
      }
      return null;
    },
  },
  {
    name: 'CUSTOMER_COOLDOWN',
    description: 'Do not contact customer too frequently',
    check: (ctx, config) => {
      if (
        (ctx.recommendedAction === 'PAYMENT_LINK' ||
          ctx.recommendedAction === 'REMINDER') &&
        ctx.lastCustomerContactHoursAgo !== null &&
        ctx.lastCustomerContactHoursAgo < config.customerCooldownHours
      ) {
        return {
          allowed: false,
          reason: `Customer was contacted ${ctx.lastCustomerContactHoursAgo.toFixed(1)} hours ago. Cooldown period is ${config.customerCooldownHours} hours.`,
          rule: 'CUSTOMER_COOLDOWN',
          details: {
            lastContact: ctx.lastCustomerContactHoursAgo,
            cooldown: config.customerCooldownHours,
          },
        };
      }
      return null;
    },
  },
  {
    name: 'MAX_NOTIFICATIONS',
    description: 'Do not send excessive customer notifications',
    check: (ctx, config) => {
      if (
        (ctx.recommendedAction === 'PAYMENT_LINK' ||
          ctx.recommendedAction === 'REMINDER') &&
        ctx.notificationsSent >= config.maxNotifications
      ) {
        return {
          allowed: false,
          reason: `Maximum customer notifications reached (${ctx.notificationsSent}/${config.maxNotifications}).`,
          rule: 'MAX_NOTIFICATIONS',
          details: { sent: ctx.notificationsSent, max: config.maxNotifications },
        };
      }
      return null;
    },
  },
  {
    name: 'NO_CONCURRENT_ACTIONS',
    description: 'Never execute two recovery actions simultaneously',
    check: (ctx) => {
      if (
        ctx.hasActiveRecoveryAction &&
        ctx.recommendedAction !== 'ESCALATE' &&
        ctx.recommendedAction !== 'STOP'
      ) {
        return {
          allowed: false,
          reason: 'Another recovery action is currently active. Cannot execute concurrent actions.',
          rule: 'NO_CONCURRENT_ACTIONS',
        };
      }
      return null;
    },
  },
  {
    name: 'EXPIRED_LINK_GUARD',
    description: 'Cannot reuse expired payment links',
    check: (ctx) => {
      if (ctx.recommendedAction === 'PAYMENT_LINK' && ctx.paymentLinkExpired) {
        return {
          allowed: false,
          reason: 'Previous payment link has expired. A new link needs to be generated.',
          rule: 'EXPIRED_LINK_GUARD',
        };
      }
      return null;
    },
  },
  {
    name: 'FRAUD_GUARD',
    description: 'Never auto-recover suspected fraud payments',
    check: (ctx) => {
      if (
        ctx.paymentContext.failureReason === 'suspected_fraud' &&
        ctx.recommendedAction !== 'ESCALATE' &&
        ctx.recommendedAction !== 'STOP'
      ) {
        return {
          allowed: false,
          reason: 'Payment was flagged for suspected fraud. Automated recovery is prohibited. Human review required.',
          rule: 'FRAUD_GUARD',
        };
      }
      return null;
    },
  },
];

// ─── Main Policy Check Function ────────────────────────────────────────────────

export function checkPolicy(
  ctx: PolicyCheckContext,
  config: PolicyEngineConfig = DEFAULT_POLICY_CONFIG
): PolicyCheckResult {
  // Escalation and Stop are always allowed (they are safety actions)
  if (ctx.recommendedAction === 'ESCALATE' || ctx.recommendedAction === 'STOP') {
    return {
      allowed: true,
      reason: `${ctx.recommendedAction} action is always permitted.`,
      rule: 'ALWAYS_ALLOW_SAFETY',
    };
  }

  // Check each rule in order
  for (const rule of POLICY_RULES) {
    const result = rule.check(ctx, config);
    if (result !== null && !result.allowed) {
      return result;
    }
  }

  // All rules passed
  return {
    allowed: true,
    reason: 'All policy checks passed. Action is approved.',
    rule: 'ALL_PASSED',
  };
}

// ─── Utility: Get all policy rules for display ────────────────────────────────

export function getPolicyRules(): { name: string; description: string }[] {
  return POLICY_RULES.map((r) => ({ name: r.name, description: r.description }));
}

// ─── Utility: Get policy config for display ───────────────────────────────────

export function getPolicyConfigDisplay(config: PolicyEngineConfig = DEFAULT_POLICY_CONFIG) {
  return {
    'Maximum Retries': config.maxRetries,
    'Maximum Recovery Attempts': config.maxRecoveryAttempts,
    'High Value Threshold': `₹${config.highValueThreshold.toLocaleString('en-IN')}`,
    'Minimum AI Confidence': `${(config.minConfidence * 100).toFixed(0)}%`,
    'Customer Cooldown': `${config.customerCooldownHours} hours`,
    'Maximum Notifications': config.maxNotifications,
  };
}
