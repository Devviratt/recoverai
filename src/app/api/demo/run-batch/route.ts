// ─── RecoverAI Batch Recovery Engine API ──────────────────────────────────────────
// POST /api/demo/run-batch — Executes real Recovery Agent across demo dataset
// Calculates dynamic database-derived batch metrics & Expected vs Realized Recovery

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runRecoveryAgent } from '@/lib/recovery/agent';
import { evaluateRecoveryStrategies } from '@/lib/engines/recovery-strategy-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = parseInt(body.count || '50', 10); // default 50 cases per batch call

    // Find eligible pending demo cases (isEvaluation: false)
    const demoCases = await prisma.recoveryCase.findMany({
      where: {
        isEvaluation: false,
        status: { in: ['AT_RISK', 'DIAGNOSING', 'ELIGIBLE', 'ACTION_SELECTED'] },
      },
      include: {
        payment: true,
        customer: true,
      },
      take: batchSize,
    });

    const results = [];
    let totalExpectedRecoverySum = 0;

    for (const c of demoCases) {
      try {
        // Calculate Expected Recovery via Strategy Engine prior to run
        const paymentCtx = {
          paymentId: c.payment.externalId,
          orderId: c.payment.orderId || '',
          amount: c.payment.amount,
          currency: c.payment.currency || 'INR',
          status: c.payment.status,
          failureReason: c.payment.failureReason || 'card_declined',
          paymentMethod: c.payment.paymentMethod || 'card',
          customerSuccessRate: c.customer.successRate || 0.8,
          previousFailures: c.customer.failedPayments || 0,
          previousSuccesses: c.customer.successfulPayments || 0,
          retryCount: c.recoveryAttempts || 0,
          hoursSinceFailure: 2,
          customerSegment: c.customer.segment || 'regular',
          customerLifetimeValue: c.customer.lifetimeValue || 10000,
          totalTransactions: c.customer.totalTransactions || 1,
        };

        const strategyEval = evaluateRecoveryStrategies(paymentCtx);
        totalExpectedRecoverySum += strategyEval.highestExpectedRecovery;

        // Run real agentic loop
        const trace = await runRecoveryAgent(c.id);
        results.push({
          caseId: c.id,
          externalId: c.payment.externalId,
          success: true,
          decision: trace.decision,
          finalStatus: trace.finalStatus,
          expectedRecovery: strategyEval.highestExpectedRecovery,
        });
      } catch (err) {
        console.error(`[Batch Run Error] Case ${c.id}:`, err);
        results.push({
          caseId: c.id,
          externalId: c.payment.externalId,
          success: false,
          error: err instanceof Error ? err.message : 'Execution error',
          expectedRecovery: 0,
        });
      }
    }

    // Compute dynamic database-derived batch metrics across ALL demo cases
    const allDemoCases = await prisma.recoveryCase.findMany({
      where: { isEvaluation: false },
      include: { payment: true },
    });

    const totalEvaluated = allDemoCases.length;
    const totalRevenueAtRisk = allDemoCases.reduce((sum, c) => sum + (c.revenueAtRisk || c.payment.amount), 0);
    const recoveredCases = allDemoCases.filter((c) => c.status === 'RECOVERED');
    const totalRealizedRecovery = recoveredCases.reduce((sum, c) => sum + (c.recoveredAmount || 0), 0);
    const escalatedCount = allDemoCases.filter((c) => c.status === 'ESCALATED').length;
    const stoppedCount = allDemoCases.filter((c) => c.status === 'STOPPED').length;
    const activePipelineCount = allDemoCases.filter((c) => ['AT_RISK', 'AWAITING_OUTCOME', 'ACTION_EXECUTED'].includes(c.status)).length;

    // Action & Strategy Distribution
    const actionCounts: Record<string, number> = {
      PAYMENT_LINK: 0,
      RETRY: 0,
      REMINDER: 0,
      ALT_METHOD: 0,
      ESCALATE: 0,
      STOP: 0,
    };

    allDemoCases.forEach((c) => {
      const act = c.recommendedAction || (c.status === 'ESCALATED' ? 'ESCALATE' : c.status === 'STOPPED' ? 'STOP' : 'PAYMENT_LINK');
      actionCounts[act] = (actionCounts[act] || 0) + 1;
    });

    const totalActions = Object.values(actionCounts).reduce((a, b) => a + b, 0) || 1;
    const strategyDistribution = Object.entries(actionCounts).map(([action, count]) => ({
      action,
      count,
      percentage: Math.round((count / totalActions) * 1000) / 10,
    }));

    return NextResponse.json({
      success: true,
      processedInThisBatch: results.length,
      successfulRuns: results.filter((r) => r.success).length,
      metrics: {
        totalEvaluated,
        totalRevenueAtRisk,
        totalRealizedRecovery,
        totalExpectedRecovery: totalExpectedRecoverySum,
        recoveryValueRatePercent: totalRevenueAtRisk > 0 ? Math.round((totalRealizedRecovery / totalRevenueAtRisk) * 1000) / 10 : 0,
        escalatedCount,
        stoppedCount,
        activePipelineCount,
        recoveredCount: recoveredCases.length,
        strategyDistribution,
      },
      results,
    });
  } catch (error) {
    console.error('[Run Batch API Error]:', error);
    return NextResponse.json({ error: 'Failed to execute batch recovery workflow' }, { status: 500 });
  }
}
