// ─── RecoverAI Case Agent Run API ──────────────────────────────────────────────
// POST /api/recovery-cases/[id]/analyze — Execute recovery agent loop on a case

import { NextRequest, NextResponse } from 'next/server';
import { runRecoveryAgent } from '@/lib/recovery/agent';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id },
    });

    if (!recoveryCase) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    const trace = await runRecoveryAgent(id);

    // Fetch updated case
    const updatedCase = await prisma.recoveryCase.findUnique({
      where: { id },
      include: {
        payment: true,
        customer: true,
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        policyDecisions: { orderBy: { createdAt: 'desc' }, take: 1 },
        recoveryActions: { orderBy: { createdAt: 'desc' }, take: 1 },
        escalation: true,
      },
    });

    return NextResponse.json({
      success: true,
      case: updatedCase,
      trace,
    });
  } catch (error) {
    console.error('[Analyze API] Agent error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run agent analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
