// ─── RecoverAI Dashboard API ────────────────────────────────────────────────────
// GET /api/dashboard — Returns all dashboard metrics computed from real data

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Total payments
    const totalPayments = await prisma.payment.count();
    const failedPayments = await prisma.payment.count({ where: { status: 'failed' } });

    // Revenue at risk (all failed payments)
    const revenueAtRiskAgg = await prisma.payment.aggregate({
      where: { status: 'failed' },
      _sum: { amount: true },
    });
    const revenueAtRisk = revenueAtRiskAgg._sum.amount || 0;

    // Recovered revenue
    const recoveredAgg = await prisma.recoveryCase.aggregate({
      where: { status: 'RECOVERED' },
      _sum: { recoveredAmount: true },
    });
    const recoveredRevenue = recoveredAgg._sum.recoveredAmount || 0;

    // Recovery rate
    const totalCases = await prisma.recoveryCase.count();
    const recoveredCases = await prisma.recoveryCase.count({ where: { status: 'RECOVERED' } });
    const recoveryRate = totalCases > 0 ? recoveredCases / totalCases : 0;

    // Active cases
    const activeCases = await prisma.recoveryCase.count({
      where: {
        status: { in: ['AT_RISK', 'DIAGNOSING', 'ELIGIBLE', 'ACTION_SELECTED', 'ACTION_EXECUTED', 'AWAITING_OUTCOME'] },
      },
    });

    // Human escalations
    const humanEscalations = await prisma.escalation.count({
      where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
    });

    // Recovery funnel
    const eligibleCases = await prisma.recoveryCase.count({
      where: { status: { not: 'AT_RISK' } },
    });
    const interventions = await prisma.recoveryAction.count();

    // Failure reasons breakdown
    const failureReasons = await prisma.payment.groupBy({
      by: ['failureReason'],
      where: { status: 'failed', failureReason: { not: null } },
      _count: true,
      _sum: { amount: true },
    });

    // Recovery actions breakdown
    const recoveryActions = await prisma.recoveryAction.groupBy({
      by: ['actionType'],
      _count: true,
    });

    // Status distribution
    const statusDistribution = await prisma.recoveryCase.groupBy({
      by: ['status'],
      _count: true,
    });

    // Stopped cases
    const stoppedCases = await prisma.recoveryCase.count({ where: { status: 'STOPPED' } });
    const escalatedCases = await prisma.recoveryCase.count({ where: { status: 'ESCALATED' } });

    return NextResponse.json({
      revenueAtRisk,
      recoveredRevenue,
      recoveryRate,
      activeCases,
      humanEscalations,
      totalPayments,
      failedPayments,
      totalCases,
      recoveredCases,
      stoppedCases,
      escalatedCases,
      funnel: {
        failed: failedPayments,
        atRisk: totalCases,
        eligible: eligibleCases,
        interventions,
        recovered: recoveredCases,
      },
      failureReasons: failureReasons.map((r) => ({
        reason: r.failureReason || 'unknown',
        count: r._count,
        amount: r._sum.amount || 0,
      })),
      recoveryActions: recoveryActions.map((a) => ({
        action: a.actionType,
        count: a._count,
      })),
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count,
      })),
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
