// ─── RecoverAI Escalations API ──────────────────────────────────────────────────
// GET /api/escalations — Fetch cases requiring human escalation / review

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const priority = searchParams.get('priority');

    const where: Prisma.EscalationWhereInput = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const escalations = await prisma.escalation.findMany({
      where,
      include: {
        recoveryCase: {
          include: {
            payment: true,
            customer: true,
            aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
            policyDecisions: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      escalations,
      total: escalations.length,
    });
  } catch (error) {
    console.error('[Escalations API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch escalations' }, { status: 500 });
  }
}
