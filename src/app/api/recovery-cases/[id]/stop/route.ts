// ─── RecoverAI Stop API ────────────────────────────────────────────────────────
// POST /api/recovery-cases/[id]/stop — Stop recovery for a case with explicit reason

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Stopped by merchant operator decision';

    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id },
    });

    if (!recoveryCase) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    const updated = await prisma.recoveryCase.update({
      where: { id },
      data: {
        status: 'STOPPED',
        stopReason: reason,
        stoppedAt: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        caseId: id,
        actor: 'merchant-user',
        action: 'STOP',
        reason,
        previousState: recoveryCase.status,
        nextState: 'STOPPED',
      },
    });

    return NextResponse.json({
      success: true,
      case: updated,
    });
  } catch (error) {
    console.error('[Stop API] Error:', error);
    return NextResponse.json({ error: 'Failed to stop recovery' }, { status: 500 });
  }
}
