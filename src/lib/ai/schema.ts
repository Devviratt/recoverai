// ─── RecoverAI AI Schema ────────────────────────────────────────────────────────
// Zod validation for AI provider responses
// Never trust free-form LLM output — always validate against this schema.

import { z } from 'zod';

// ─── AI Diagnosis Schema ────────────────────────────────────────────────────────

export const AIDiagnosisSchema = z.object({
  diagnosis: z.string().min(10).max(500),
  recommended_action: z.enum([
    'RETRY',
    'PAYMENT_LINK',
    'REMINDER',
    'ALT_METHOD',
    'ESCALATE',
    'STOP',
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.array(z.string().min(5).max(300)).min(1).max(10),
  customer_message: z.string().min(10).max(1000),
});

export type AIDiagnosisResponse = z.infer<typeof AIDiagnosisSchema>;

// ─── Payment Context Schema (what we send to AI) ──────────────────────────────

export const PaymentContextSchema = z.object({
  payment_id: z.string(),
  order_id: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  failure_reason: z.string(),
  payment_method: z.string(),
  customer_success_rate: z.number().min(0).max(1),
  previous_failures: z.number().int().min(0),
  previous_successes: z.number().int().min(0),
  retry_count: z.number().int().min(0),
  hours_since_failure: z.number().min(0),
  customer_segment: z.string(),
  customer_lifetime_value: z.number().min(0),
  total_transactions: z.number().int().min(0),
});

export const StrategyCandidateSchema = z.object({
  action: z.enum(['RETRY', 'PAYMENT_LINK', 'REMINDER', 'ALT_METHOD', 'ESCALATE', 'STOP']),
  estimated_recovery_probability: z.number().min(0).max(1),
  expected_recovery: z.number().min(0),
  expected_incremental_recovery: z.number().min(0),
  operational_cost: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  confidence: z.number().min(0).max(1),
  eligible: z.boolean(),
  ineligibility_reason: z.string().nullable(),
});

export const StrategyComparisonSchema = z.object({
  candidates: z.array(StrategyCandidateSchema).min(1),
  recommended_action: z.enum(['RETRY', 'PAYMENT_LINK', 'REMINDER', 'ALT_METHOD', 'ESCALATE', 'STOP']),
  decision_reason: z.string().min(5).max(500),
  baseline_expected_recovery: z.number().min(0),
  highest_expected_recovery: z.number().min(0),
});

export type StrategyComparisonResponse = z.infer<typeof StrategyComparisonSchema>;

// ─── Validate AI Response ──────────────────────────────────────────────────────

export function validateAIResponse(response: unknown): AIDiagnosisResponse | null {
  try {
    return AIDiagnosisSchema.parse(response);
  } catch {
    return null;
  }
}

// ─── Safe parse with error details ─────────────────────────────────────────────

export function safeParseAIResponse(response: unknown) {
  return AIDiagnosisSchema.safeParse(response);
}
