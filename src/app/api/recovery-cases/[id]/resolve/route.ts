// ─── RecoverAI Resolve Escalation API ──────────────────────────────────────────
// POST /api/recovery-cases/[id]/resolve — Resolve human escalation case

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, notes, resolution } = body; // action: 'APPROVE' | 'REJECT' | 'RESOLVE'

    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id },
      include: { escalation: true },
    });

    if (!recoveryCase) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    let newStatus: string = recoveryCase.status;
    let escalationStatus = 'RESOLVED';

    if (action === 'APPROVE') {
      newStatus = 'ACTION_SELECTED';
      escalationStatus = 'APPROVED';
    } else if (action === 'REJECT') {
      newStatus = 'STOPPED';
      escalationStatus = 'REJECTED';
    } else {
      newStatus = 'RECOVERED';
      escalationStatus = 'RESOLVED';
    }

    if (recoveryCase.escalation) {
      await prisma.escalation.update({
        where: { id: recoveryCase.escalation.id },
        data: {
          status: escalationStatus,
          humanNotes: notes,
          resolution: resolution || `Human action taken: ${action}`,
          resolvedAt: new Date(),
        },
      });
    }

    const updatedCase = await prisma.recoveryCase.update({
      where: { id },
      data: {
        status: newStatus,
        ...(action === 'REJECT' ? { stopReason: notes || 'Rejected by human operator' } : {}),
        ...(action === 'RESOLVE' ? { recoveredAmount: recoveryCase.revenueAtRisk || 0, recoveredAt: new Date() } : {}),
      },
    });

    await prisma.auditEvent.create({
      data: {
        caseId: id,
        actor: 'merchant-user',
        action: `HUMAN_${action}`,
        reason: notes || `Escalation ${action.toLowerCase()}d by human operator`,
        previousState: 'ESCALATED',
        nextState: newStatus,
        metadata: JSON.stringify({ resolution, notes }),
      },
    });

    return NextResponse.json({
      success: true,
      case: updatedCase,
    });
  } catch (error) {
    console.error('[Resolve API] Error:', error);
    return NextResponse.json({ error: 'Failed to resolve escalation' }, { status: 500 });
  }
}
