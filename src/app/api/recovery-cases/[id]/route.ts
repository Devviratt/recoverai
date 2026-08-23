// ─── RecoverAI Single Case Detail API ──────────────────────────────────────────
// GET /api/recovery-cases/[id] — Fetch detailed recovery case with full context

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id },
      include: {
        payment: true,
        customer: {
          include: {
            payments: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
        },
        policyDecisions: {
          orderBy: { createdAt: 'desc' },
        },
        recoveryActions: {
          orderBy: { createdAt: 'desc' },
        },
        auditEvents: {
          orderBy: { timestamp: 'asc' },
        },
        escalation: true,
      },
    });

    if (!recoveryCase) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    return NextResponse.json(recoveryCase);
  } catch (error) {
    console.error('[Case Detail API] Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case details' }, { status: 500 });
  }
}
