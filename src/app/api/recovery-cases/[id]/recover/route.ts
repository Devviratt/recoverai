// ─── RecoverAI Complete Recovery API ───────────────────────────────────────────
// POST /api/recovery-cases/[id]/recover — Complete payment recovery for a case (simulates payment success)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id },
      include: { payment: true, customer: true },
    });

    if (!recoveryCase) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    if (recoveryCase.status === 'RECOVERED') {
      return NextResponse.json({ message: 'Case is already recovered', case: recoveryCase });
    }

    // Update case to RECOVERED
    const updated = await prisma.recoveryCase.update({
      where: { id },
      data: {
        status: 'RECOVERED',
        recoveredAmount: recoveryCase.payment.amount,
        recoveredAt: new Date(),
      },
    });

    // Update customer stats
    await prisma.customer.update({
      where: { id: recoveryCase.customerId },
      data: {
        successfulPayments: { increment: 1 },
        failedPayments: { decrement: 1 },
        successRate:
          (recoveryCase.customer.successfulPayments + 1) /
          recoveryCase.customer.totalTransactions,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        caseId: id,
        actor: 'merchant-user',
        action: 'RECOVER_PAYMENT',
        reason: 'Payment completed via recovery mechanism',
        previousState: recoveryCase.status,
        nextState: 'RECOVERED',
        executionResult: 'SUCCESS',
        metadata: JSON.stringify({ amount: recoveryCase.payment.amount }),
      },
    });

    return NextResponse.json({
      success: true,
      recoveredAmount: recoveryCase.payment.amount,
      case: updated,
    });
  } catch (error) {
    console.error('[Recover API] Error completing recovery:', error);
    return NextResponse.json({ error: 'Failed to complete recovery' }, { status: 500 });
  }
}
