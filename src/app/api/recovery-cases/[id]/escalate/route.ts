// ─── RecoverAI Escalate API ─────────────────────────────────────────────────────
// POST /api/recovery-cases/[id]/escalate — Escalate case to human review queue

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Manual escalation by merchant operator';

    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id },
    });

    if (!recoveryCase) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    // Upsert escalation
    const escalation = await prisma.escalation.upsert({
      where: { caseId: id },
      create: {
        caseId: id,
        reason,
        priority: recoveryCase.priority || 'HIGH',
        status: 'PENDING',
        aiSummary: recoveryCase.aiDiagnosis || undefined,
      },
      update: {
        reason,
        status: 'PENDING',
      },
    });

    // Update case status
    const updated = await prisma.recoveryCase.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalatedAt: new Date(),
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        caseId: id,
        actor: 'merchant-user',
        action: 'ESCALATE',
        reason,
        previousState: recoveryCase.status,
        nextState: 'ESCALATED',
      },
    });

    return NextResponse.json({
      success: true,
      case: updated,
      escalation,
    });
  } catch (error) {
    console.error('[Escalate API] Error:', error);
    return NextResponse.json({ error: 'Failed to escalate case' }, { status: 500 });
  }
}
