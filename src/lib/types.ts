// ─── RecoverAI Types ───────────────────────────────────────────────────────────
// Core type definitions used across all engines

// ─── Enums ─────────────────────────────────────────────────────────────────────

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RecoveryStatus =
  | 'AT_RISK'
  | 'DIAGNOSING'
  | 'ELIGIBLE'
  | 'ACTION_SELECTED'
  | 'ACTION_EXECUTED'
  | 'AWAITING_OUTCOME'
  | 'RECOVERED'
  | 'ESCALATED'
  | 'STOPPED'
  | 'FAILED';

export type RecoveryActionType =
  | 'RETRY'
  | 'PAYMENT_LINK'
  | 'REMINDER'
  | 'ALT_METHOD'
  | 'ESCALATE'
  | 'STOP';

export type FailureReason =
  | 'insufficient_funds'
  | 'card_declined'
  | 'bank_timeout'
  | 'authentication_failed'
  | 'invalid_card'
  | 'card_expired'
  | 'network_error'
  | 'international_card_blocked'
  | 'daily_limit_exceeded'
  | 'suspected_fraud'
  | 'account_closed'
  | 'technical_error';

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

export type CustomerSegment = 'regular' | 'premium' | 'enterprise';

export type EscalationStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED';

// ─── Risk Engine ───────────────────────────────────────────────────────────────

export interface RiskScoreResult {
  riskScore: number;       // 0-100
  priority: Priority;
  revenueAtRisk: number;   // amount in INR
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  rawValue: number;
  normalizedValue: number;
  contribution: number;
}

export interface RiskEngineConfig {
  amountWeight: number;
  historyWeight: number;
  failureWeight: number;
  recencyWeight: number;
  retryWeight: number;
  segmentWeight: number;
  highValueThreshold: number;
}

// ─── Payment Context ──────────────────────────────────────────────────────────

export interface PaymentContext {
  paymentId: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: string;
  failureReason: string;
  paymentMethod: string;
  customerSuccessRate: number;
  previousFailures: number;
  previousSuccesses: number;
  retryCount: number;
  hoursSinceFailure: number;
  customerSegment: string;
  customerLifetimeValue: number;
  totalTransactions: number;
}

// ─── AI Diagnosis ──────────────────────────────────────────────────────────────

export interface AIDiagnosis {
  diagnosis: string;
  recommendedAction: RecoveryActionType;
  confidence: number;        // 0-1
  reasoning: string[];
  customerMessage: string;
}

export interface AIProviderInterface {
  diagnose(context: PaymentContext, strategyComparison?: StrategyComparison): Promise<AIDiagnosis>;
  readonly providerName: string;
}

// ─── Recovery Strategy Engine ──────────────────────────────────────────────────

export interface StrategyCandidate {
  action: RecoveryActionType;
  estimatedRecoveryProbability: number; // 0.0 - 1.0 (deterministic estimated recovery probability)
  expectedRecovery: number;              // amount * estimatedRecoveryProbability (in INR)
  expectedIncrementalRecovery: number;   // expectedRecovery - baselineExpectedRecovery (in INR)
  operationalCost: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;                    // 0.0 - 1.0
  eligible: boolean;
  ineligibilityReason: string | null;
}

export interface StrategyComparison {
  candidates: StrategyCandidate[];
  recommendedAction: RecoveryActionType;
  decisionReason: string;
  baselineExpectedRecovery: number;
  highestExpectedRecovery: number;
}

export interface WhatIfSimulationResult {
  paymentContext: PaymentContext;
  baselineExpectedRecovery: number;
  candidates: StrategyCandidate[];
  bestStrategy: RecoveryActionType;
  expectedIncrementalRecovery: number;
  recoveryValueLiftPercent: number;
}

// ─── Policy Engine ─────────────────────────────────────────────────────────────

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  rule: string;
  details?: Record<string, unknown>;
}

export interface PolicyEngineConfig {
  maxRetries: number;
  maxRecoveryAttempts: number;
  highValueThreshold: number;
  minConfidence: number;
  customerCooldownHours: number;
  maxNotifications: number;
}

// ─── Recovery Workflow ─────────────────────────────────────────────────────────

export interface RecoveryWorkflowResult {
  caseId: string;
  status: RecoveryStatus;
  action?: RecoveryActionType;
  policyResult?: PolicyCheckResult;
  executionResult?: ActionExecutionResult;
  diagnosis?: AIDiagnosis;
  stopReason?: string;
}

export interface ActionExecutionResult {
  success: boolean;
  action: RecoveryActionType;
  details: Record<string, unknown>;
  error?: string;
}

// ─── Payment Provider ──────────────────────────────────────────────────────────

export interface PaymentLinkParams {
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  referenceId: string;
  expireBy?: number; // unix timestamp
  notifyEmail?: boolean;
  notifySms?: boolean;
}

export interface PaymentLinkResult {
  id: string;
  shortUrl: string;
  status: string;
  amount: number;
  currency: string;
  expireBy?: number;
}

export interface PaymentProviderInterface {
  getPayment(id: string): Promise<Record<string, unknown>>;
  createRecoveryPaymentLink(params: PaymentLinkParams): Promise<PaymentLinkResult>;
  getPaymentLink(id: string): Promise<PaymentLinkResult>;
  cancelPaymentLink(id: string): Promise<void>;
  readonly providerName: string;
  readonly isTestMode: boolean;
}

// ─── Agent Trace ───────────────────────────────────────────────────────────────

export interface AgentStep {
  stepNumber: number;
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  timestamp: string;
}

export interface AgentTrace {
  runId: string;
  caseId: string;
  steps: AgentStep[];
  totalDurationMs: number;
  decision: RecoveryActionType;
  confidence: number;
  policyResult: string;
  finalStatus: RecoveryStatus;
  timestamp: string;
}

// ─── Evaluation ────────────────────────────────────────────────────────────────

export interface EvaluationMetrics {
  datasetSize: number;
  evaluationSetSize: number;
  seed: number;
  
  // Revenue
  totalRevenueAtRisk: number;
  eligibleRevenue: number;
  recoveredRevenue: number;
  recoveryRate: number;           // % of cases
  recoveryValueRate: number;      // % of ₹ amount
  
  // Baseline comparison
  baselineRecoveryAmount: number; // without RecoverAI
  additionalRecovery: number;     // RecoverAI minus baseline
  recoveryValueLift: number;      // lift percentage
  
  // Actions
  totalInterventions: number;
  averageAttempts: number;
  escalationRate: number;
  stopRate: number;
  falseInterventionRate: number;
  
  // AI
  averageConfidence: number;
  confidenceDistribution: { bucket: string; count: number }[];
  
  // By action type
  actionSuccessRates: { action: RecoveryActionType; total: number; successful: number; rate: number }[];
  
  // By failure reason
  recoveryByFailureReason: { reason: string; total: number; recovered: number; rate: number }[];

  // Synthetic label
  isSynthetic: boolean;
  evaluationLabel: string;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  revenueAtRisk: number;
  recoveredRevenue: number;
  recoveryRate: number;
  activeCases: number;
  humanEscalations: number;
  totalPayments: number;
  failedPayments: number;
  
  // Funnel
  funnel: {
    failed: number;
    atRisk: number;
    eligible: number;
    interventions: number;
    recovered: number;
  };
  
  // Charts
  failureReasons: { reason: string; count: number; amount: number }[];
  recoveryActions: { action: string; count: number }[];
  dailyTrend: { date: string; atRisk: number; recovered: number }[];
}

// ─── Stopping Rules ──────────────────────────────────────────────────────────

export interface StoppingRuleResult {
  shouldStop: boolean;
  rule?: string;
  reason?: string;
}
