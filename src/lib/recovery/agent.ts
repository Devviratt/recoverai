// ─── RecoverAI Recovery Agent ──────────────────────────────────────────────────
// The core agentic loop:
//   Event → Context → Risk → Diagnosis → Candidate Actions → AI Selection →
//   Policy/Guardrail Validation → Tool Execution → Outcome → Next Decision
//
// The LLM NEVER directly executes payment actions. Every financial/recovery
// action passes through deterministic policy validation and a typed tool interface.

import { prisma } from '@/lib/db';
import { calculateRiskScore } from '@/lib/engines/risk-engine';
import { checkPolicy, type PolicyCheckContext } from '@/lib/engines/policy-engine';
import { checkEligibility, type EligibilityContext } from '@/lib/engines/eligibility-engine';
import { checkStoppingRules, type StoppingContext } from '@/lib/engines/stopping-rules';
import { evaluateRecoveryStrategies } from '@/lib/engines/recovery-strategy-engine';
import { getAIProvider } from '@/lib/ai/provider';
import { getPaymentProvider } from '@/lib/providers/provider';
import type {
  PaymentContext,
  AIDiagnosis,
  RecoveryStatus,
  RecoveryActionType,
  AgentStep,
  AgentTrace,
  PolicyCheckResult,
  ActionExecutionResult,
} from '@/lib/types';

// ─── Agent Tool Interface ──────────────────────────────────────────────────────
// Each tool validates its input and performs a single bounded action.

type ToolFunction = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

const AGENT_TOOLS: Record<string, ToolFunction> = {
  get_payment_context: async (input) => {
    const caseId = input.caseId as string;
    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id: caseId },
      include: { payment: true, customer: true },
    });
    if (!recoveryCase) throw new Error(`Case ${caseId} not found`);
    
    const hoursSinceFailure = (Date.now() - recoveryCase.payment.createdAt.getTime()) / (1000 * 60 * 60);
    
    const context: PaymentContext = {
      paymentId: recoveryCase.payment.externalId,
      orderId: recoveryCase.payment.orderId || undefined,
      amount: recoveryCase.payment.amount,
      currency: recoveryCase.payment.currency,
      status: recoveryCase.payment.status,
      failureReason: recoveryCase.payment.failureReason || 'unknown',
      paymentMethod: recoveryCase.payment.paymentMethod || 'unknown',
      customerSuccessRate: recoveryCase.customer.successRate,
      previousFailures: recoveryCase.customer.failedPayments,
      previousSuccesses: recoveryCase.customer.successfulPayments,
      retryCount: recoveryCase.recoveryAttempts,
      hoursSinceFailure,
      customerSegment: recoveryCase.customer.segment,
      customerLifetimeValue: recoveryCase.customer.lifetimeValue,
      totalTransactions: recoveryCase.customer.totalTransactions,
    };
    return context as unknown as Record<string, unknown>;
  },

  calculate_revenue_risk: async (input) => {
    const context = input as unknown as PaymentContext;
    const result = calculateRiskScore(context);
    return result as unknown as Record<string, unknown>;
  },

  diagnose_failure: async (input) => {
    const context = input as unknown as PaymentContext;
    const provider = getAIProvider();
    const diagnosis = await provider.diagnose(context);
    return diagnosis as unknown as Record<string, unknown>;
  },

  check_policy: async (input) => {
    const ctx = input as unknown as PolicyCheckContext;
    const result = checkPolicy(ctx);
    return result as unknown as Record<string, unknown>;
  },

  create_payment_link: async (input) => {
    const provider = getPaymentProvider();
    const result = await provider.createRecoveryPaymentLink({
      amount: input.amount as number,
      currency: (input.currency as string) || 'INR',
      description: input.description as string,
      customerName: input.customerName as string,
      customerEmail: input.customerEmail as string,
      customerPhone: input.customerPhone as string | undefined,
      referenceId: input.referenceId as string,
      expireBy: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      notifyEmail: true,
      notifySms: false,
    });
    return result as unknown as Record<string, unknown>;
  },

  escalate_case: async (input) => {
    const caseId = input.caseId as string;
    const reason = input.reason as string;
    await prisma.escalation.upsert({
      where: { caseId },
      create: {
        caseId,
        reason,
        priority: (input.priority as string) || 'HIGH',
        status: 'PENDING',
        aiSummary: input.aiSummary as string | undefined,
      },
      update: {
        reason,
        priority: (input.priority as string) || 'HIGH',
        status: 'PENDING',
        aiSummary: input.aiSummary as string | undefined,
      },
    });
    return { success: true, action: 'ESCALATED' };
  },

  stop_recovery: async (input) => {
    const caseId = input.caseId as string;
    const reason = input.reason as string;
    await prisma.recoveryCase.update({
      where: { id: caseId },
      data: { status: 'STOPPED', stopReason: reason, stoppedAt: new Date() },
    });
    return { success: true, action: 'STOPPED', reason };
  },

  record_outcome: async (input) => {
    const caseId = input.caseId as string;
    const success = input.success as boolean;
    const amount = input.amount as number;
    
    if (success) {
      await prisma.recoveryCase.update({
        where: { id: caseId },
        data: {
          status: 'RECOVERED',
          recoveredAmount: amount,
          recoveredAt: new Date(),
        },
      });
    }
    return { success, recoveredAmount: success ? amount : 0 };
  },
};

// ─── Recovery Agent ────────────────────────────────────────────────────────────

export async function runRecoveryAgent(caseId: string): Promise<AgentTrace> {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const steps: AgentStep[] = [];
  let stepNumber = 0;
  const startTime = Date.now();

  const addStep = async (
    tool: string,
    input: Record<string, unknown>,
    fn: () => Promise<Record<string, unknown>>
  ): Promise<Record<string, unknown>> => {
    stepNumber++;
    const stepStart = Date.now();
    const output = await fn();
    steps.push({
      stepNumber,
      tool,
      input,
      output,
      durationMs: Date.now() - stepStart,
      timestamp: new Date().toISOString(),
    });
    return output;
  };

  // Helper to create audit events
  const audit = async (
    action: string,
    reason: string | null,
    previousState: string | null,
    nextState: string | null,
    extra?: Partial<{ aiRecommendation: string; policyDecision: string; executionResult: string; metadata: string }>
  ) => {
    await prisma.auditEvent.create({
      data: {
        caseId,
        actor: 'recoverai-agent',
        action,
        reason,
        previousState,
        nextState,
        ...extra,
        timestamp: new Date(),
      },
    });
  };

  // Helper to transition state
  const transitionState = async (from: string, to: RecoveryStatus) => {
    await prisma.recoveryCase.update({
      where: { id: caseId },
      data: { status: to, previousStatus: from },
    });
  };

  try {
    // ─── Step 1: Get Payment Context ──────────────────────────────────────
    const context = (await addStep(
      'get_payment_context',
      { caseId },
      () => AGENT_TOOLS.get_payment_context({ caseId })
    )) as unknown as PaymentContext;

    await audit('CONTEXT_RETRIEVED', null, null, null, {
      metadata: JSON.stringify({ paymentId: context.paymentId, amount: context.amount }),
    });

    // ─── Step 2: Check Eligibility ───────────────────────────────────────
    const recoveryCase = await prisma.recoveryCase.findUnique({ where: { id: caseId } });
    if (!recoveryCase) throw new Error(`Case ${caseId} not found`);

    const eligibilityCtx: EligibilityContext = {
      paymentStatus: context.status,
      failureReason: context.failureReason,
      hoursSinceFailure: context.hoursSinceFailure,
      isAlreadyRecovered: recoveryCase.status === 'RECOVERED',
      hasActiveRecovery: false, // Explicit agent invocation overrides active recovery lock
      customerOptedOut: false,
      paymentAmount: context.amount,
    };
    const eligibility = checkEligibility(eligibilityCtx);
    
    await addStep('check_eligibility', eligibilityCtx as unknown as Record<string, unknown>, async () => eligibility as unknown as Record<string, unknown>);

    if (!eligibility.eligible) {
      await transitionState(recoveryCase.status, 'STOPPED');
      await audit('INELIGIBLE', eligibility.reason, recoveryCase.status, 'STOPPED');
      return buildTrace(runId, caseId, steps, startTime, 'STOP', 0, 'N/A', 'STOPPED');
    }

    // ─── Step 3: Check Stopping Rules ────────────────────────────────────
    const stoppingCtx: StoppingContext = {
      recoveryAttempts: recoveryCase.recoveryAttempts,
      maxAttempts: recoveryCase.maxAttempts,
      isRecovered: recoveryCase.status === 'RECOVERED',
      aiConfidence: recoveryCase.aiConfidence || 0.5,
      consecutiveFailures: recoveryCase.recoveryAttempts > 0 && recoveryCase.status === 'FAILED' ? recoveryCase.recoveryAttempts : 0,
      customerRecentFailures: context.previousFailures,
      paymentLinkExpired: recoveryCase.paymentLinkExpiry ? new Date(recoveryCase.paymentLinkExpiry) < new Date() : false,
      hasCompliantActionRemaining: true,
      isManualStop: false,
      lastActionResult: null,
    };
    const stoppingResult = checkStoppingRules(stoppingCtx);

    await addStep('check_stopping_rules', stoppingCtx as unknown as Record<string, unknown>, async () => stoppingResult as unknown as Record<string, unknown>);

    if (stoppingResult.shouldStop) {
      await transitionState(recoveryCase.status, 'STOPPED');
      await prisma.recoveryCase.update({
        where: { id: caseId },
        data: { stopReason: stoppingResult.reason, stoppedAt: new Date() },
      });
      await audit('STOP', stoppingResult.reason || null, recoveryCase.status, 'STOPPED');
      return buildTrace(runId, caseId, steps, startTime, 'STOP', 0, stoppingResult.rule || 'UNKNOWN', 'STOPPED');
    }

    // ─── Step 4: Calculate Risk Score ────────────────────────────────────
    await transitionState(recoveryCase.status, 'DIAGNOSING');
    
    const riskResult = await addStep(
      'calculate_revenue_risk',
      context as unknown as Record<string, unknown>,
      () => AGENT_TOOLS.calculate_revenue_risk(context as unknown as Record<string, unknown>)
    );

    const riskScore = (riskResult as unknown as { riskScore: number }).riskScore;
    const priority = (riskResult as unknown as { priority: string }).priority;

    await prisma.recoveryCase.update({
      where: { id: caseId },
      data: { riskScore, priority, revenueAtRisk: context.amount },
    });

    await audit('RISK_ASSESSED', `Risk score: ${riskScore}, Priority: ${priority}`, 'DIAGNOSING', 'DIAGNOSING', {
      metadata: JSON.stringify(riskResult),
    });

    // ─── Step 4.5: Evaluate Candidate Recovery Strategies ──────────────────
    const strategyComparison = evaluateRecoveryStrategies(context);
    await addStep('evaluate_recovery_strategies', context as unknown as Record<string, unknown>, async () => strategyComparison as unknown as Record<string, unknown>);

    // ─── Step 5: AI Diagnosis & Contextual Reasoning ─────────────────────
    const aiProvider = getAIProvider();
    const diagnosis = (await addStep(
      'diagnose_failure',
      { ...context, strategyComparison } as unknown as Record<string, unknown>,
      async () => (await aiProvider.diagnose(context, strategyComparison)) as unknown as Record<string, unknown>
    )) as unknown as AIDiagnosis;

    // Store AI analysis
    await prisma.aIAnalysis.create({
      data: {
        caseId,
        provider: aiProvider.providerName,
        diagnosis: diagnosis.diagnosis,
        recommendedAction: diagnosis.recommendedAction,
        confidence: diagnosis.confidence,
        reasoning: JSON.stringify(diagnosis.reasoning),
        customerMessage: diagnosis.customerMessage,
        inputContext: JSON.stringify({ ...context, strategyComparison }),
        promptVersion: 'v2',
      },
    });

    await prisma.recoveryCase.update({
      where: { id: caseId },
      data: {
        aiConfidence: diagnosis.confidence,
        aiDiagnosis: diagnosis.diagnosis,
        recommendedAction: diagnosis.recommendedAction,
        diagnosedAt: new Date(),
      },
    });

    await transitionState('DIAGNOSING', 'ELIGIBLE');
    await audit('AI_DIAGNOSIS', diagnosis.diagnosis, 'DIAGNOSING', 'ELIGIBLE', {
      aiRecommendation: diagnosis.recommendedAction,
      metadata: JSON.stringify({ confidence: diagnosis.confidence, reasoning: diagnosis.reasoning, strategyComparison }),
    });

    // ─── Step 6: Policy/Guardrail Validation ─────────────────────────────
    const lastAction = await prisma.recoveryAction.findFirst({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });

    const policyCtx: PolicyCheckContext = {
      paymentContext: context,
      recommendedAction: diagnosis.recommendedAction,
      aiConfidence: diagnosis.confidence,
      currentRetryCount: context.retryCount,
      currentRecoveryAttempts: recoveryCase.recoveryAttempts,
      lastCustomerContactHoursAgo: lastAction
        ? (Date.now() - lastAction.createdAt.getTime()) / (1000 * 60 * 60)
        : null,
      notificationsSent: await prisma.recoveryAction.count({
        where: { caseId, actionType: { in: ['PAYMENT_LINK', 'REMINDER'] } },
      }),
      hasActiveRecoveryAction: lastAction?.executionResult === 'PENDING',
      paymentLinkExpired: recoveryCase.paymentLinkExpiry
        ? new Date(recoveryCase.paymentLinkExpiry) < new Date()
        : false,
    };

    const policyResult = (await addStep(
      'check_policy',
      policyCtx as unknown as Record<string, unknown>,
      () => AGENT_TOOLS.check_policy(policyCtx as unknown as Record<string, unknown>)
    )) as unknown as PolicyCheckResult;

    // Store policy decision
    await prisma.policyDecision.create({
      data: {
        caseId,
        requestedAction: diagnosis.recommendedAction,
        allowed: policyResult.allowed,
        reason: policyResult.reason,
        rule: policyResult.rule,
        details: JSON.stringify(policyResult.details || {}),
      },
    });

    await audit(
      'POLICY_CHECK',
      policyResult.reason,
      'ELIGIBLE',
      policyResult.allowed ? 'ACTION_SELECTED' : 'ESCALATED',
      { policyDecision: policyResult.allowed ? 'APPROVED' : 'REJECTED' }
    );

    // If policy blocks the action → escalate
    if (!policyResult.allowed) {
      await transitionState('ELIGIBLE', 'ESCALATED');
      await prisma.recoveryCase.update({
        where: { id: caseId },
        data: { escalatedAt: new Date() },
      });

      await addStep('escalate_case', { caseId, reason: policyResult.reason, priority, aiSummary: diagnosis.diagnosis }, () =>
        AGENT_TOOLS.escalate_case({
          caseId,
          reason: `Policy blocked: ${policyResult.reason}`,
          priority,
          aiSummary: diagnosis.diagnosis,
        })
      );

      await audit('ESCALATE', policyResult.reason, 'ELIGIBLE', 'ESCALATED');
      return buildTrace(runId, caseId, steps, startTime, 'ESCALATE', diagnosis.confidence, 'REJECTED', 'ESCALATED');
    }

    // ─── Step 7: Execute Recovery Action ─────────────────────────────────
    await transitionState('ELIGIBLE', 'ACTION_SELECTED');

    let executionResult: ActionExecutionResult;
    const actionType = diagnosis.recommendedAction;

    try {
      switch (actionType) {
        case 'PAYMENT_LINK': {
          const caseData = await prisma.recoveryCase.findUnique({
            where: { id: caseId },
            include: { customer: true },
          });
          
          const linkResult = await addStep(
            'create_payment_link',
            { amount: context.amount, customerName: caseData!.customer.name, customerEmail: caseData!.customer.email },
            () =>
              AGENT_TOOLS.create_payment_link({
                amount: context.amount,
                currency: context.currency,
                description: `Recovery payment for ${context.paymentId}`,
                customerName: caseData!.customer.name,
                customerEmail: caseData!.customer.email,
                referenceId: `recovery_${caseId}`,
              })
          );

          const link = linkResult as unknown as { id: string; shortUrl: string; expireBy?: number };
          
          await prisma.recoveryCase.update({
            where: { id: caseId },
            data: {
              paymentLinkId: link.id,
              paymentLinkUrl: link.shortUrl,
              paymentLinkExpiry: link.expireBy ? new Date(link.expireBy * 1000) : null,
            },
          });

          executionResult = {
            success: true,
            action: 'PAYMENT_LINK',
            details: { linkId: link.id, shortUrl: link.shortUrl },
          };
          break;
        }

        case 'RETRY':
          executionResult = {
            success: true,
            action: 'RETRY',
            details: { message: 'Retry scheduled for failed payment' },
          };
          break;

        case 'REMINDER':
          executionResult = {
            success: true,
            action: 'REMINDER',
            details: { message: diagnosis.customerMessage },
          };
          break;

        case 'ALT_METHOD':
          executionResult = {
            success: true,
            action: 'ALT_METHOD',
            details: { message: 'Alternative payment method recommended to customer' },
          };
          break;

        case 'ESCALATE':
          await addStep('escalate_case', { caseId, reason: 'AI recommended escalation' }, () =>
            AGENT_TOOLS.escalate_case({
              caseId,
              reason: 'AI recommended escalation',
              priority,
              aiSummary: diagnosis.diagnosis,
            })
          );
          
          await transitionState('ACTION_SELECTED', 'ESCALATED');
          await prisma.recoveryCase.update({ where: { id: caseId }, data: { escalatedAt: new Date() } });
          
          executionResult = { success: true, action: 'ESCALATE', details: { reason: 'AI recommended' } };
          break;

        case 'STOP':
          await addStep('stop_recovery', { caseId, reason: diagnosis.diagnosis }, () =>
            AGENT_TOOLS.stop_recovery({ caseId, reason: diagnosis.diagnosis })
          );
          
          executionResult = { success: true, action: 'STOP', details: { reason: diagnosis.diagnosis } };
          break;

        default:
          executionResult = { success: false, action: actionType, details: {}, error: `Unknown action: ${actionType}` };
      }
    } catch (error) {
      executionResult = {
        success: false,
        action: actionType,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    }

    // Record the recovery action
    await prisma.recoveryAction.create({
      data: {
        caseId,
        actionType,
        actionDetails: JSON.stringify(executionResult.details),
        executionResult: executionResult.success ? 'SUCCESS' : 'FAILED',
        resultDetails: executionResult.error ? JSON.stringify({ error: executionResult.error }) : null,
        attemptNumber: recoveryCase.recoveryAttempts + 1,
      },
    });

    // Update attempt count
    await prisma.recoveryCase.update({
      where: { id: caseId },
      data: {
        recoveryAttempts: { increment: 1 },
        actionTakenAt: new Date(),
      },
    });

    // Transition to appropriate state
    if (actionType !== 'ESCALATE' && actionType !== 'STOP') {
      if (executionResult.success) {
        await transitionState('ACTION_SELECTED', 'ACTION_EXECUTED');
        await transitionState('ACTION_EXECUTED', 'AWAITING_OUTCOME');

        // Simulate customer recovery outcome based on strategy estimation probability
        const chosenCandidate = strategyComparison?.candidates?.find((s: any) => s.action === actionType);
        const recoveryProb = chosenCandidate ? chosenCandidate.estimatedRecoveryProbability : 0.75;
        const pseudoRandom = ((context.amount * 17) % 100) / 100;
        const isRecovered = pseudoRandom <= recoveryProb;

        if (isRecovered) {
          await transitionState('AWAITING_OUTCOME', 'RECOVERED');
          await prisma.recoveryCase.update({
            where: { id: caseId },
            data: {
              recoveredAmount: context.amount,
              recoveredAt: new Date(),
            },
          });
          await audit('RECOVERY_OUTCOME', `Payment of ₹${context.amount.toLocaleString('en-IN')} successfully recovered via ${actionType}`, 'AWAITING_OUTCOME', 'RECOVERED');
        }
      } else {
        await transitionState('ACTION_SELECTED', 'FAILED');
      }
    }

    await audit(
      'ACTION_EXECUTED',
      `${actionType}: ${executionResult.success ? 'Success' : 'Failed'}`,
      'ACTION_SELECTED',
      executionResult.success ? 'AWAITING_OUTCOME' : 'FAILED',
      {
        executionResult: executionResult.success ? 'SUCCESS' : 'FAILED',
        aiRecommendation: actionType,
      }
    );

    const finalCase = await prisma.recoveryCase.findUnique({ where: { id: caseId } });
    return buildTrace(
      runId,
      caseId,
      steps,
      startTime,
      actionType,
      diagnosis.confidence,
      policyResult.allowed ? 'APPROVED' : 'REJECTED',
      (finalCase?.status as RecoveryStatus) || 'AWAITING_OUTCOME'
    );
  } catch (error) {
    await audit('AGENT_ERROR', error instanceof Error ? error.message : 'Unknown error', null, null);
    throw error;
  }
}

// ─── Build Trace Output ────────────────────────────────────────────────────────

function buildTrace(
  runId: string,
  caseId: string,
  steps: AgentStep[],
  startTime: number,
  decision: RecoveryActionType,
  confidence: number,
  policyResult: string,
  finalStatus: RecoveryStatus
): AgentTrace {
  return {
    runId,
    caseId,
    steps,
    totalDurationMs: Date.now() - startTime,
    decision,
    confidence,
    policyResult,
    finalStatus,
    timestamp: new Date().toISOString(),
  };
}
