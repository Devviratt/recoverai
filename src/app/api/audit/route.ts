// ─── RecoverAI Global Audit Trail API ──────────────────────────────────────────
// GET /api/audit — Fetch audit log events with filtering & pagination

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const actor = searchParams.get('actor');
    const action = searchParams.get('action');
    const caseId = searchParams.get('caseId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: Prisma.AuditEventWhereInput = {};

    if (actor) {
      where.actor = actor;
    }

    if (action) {
      where.action = action;
    }

    if (caseId) {
      where.caseId = caseId;
    }

    if (search) {
      where.OR = [
        { caseId: { contains: search } },
        { action: { contains: search } },
        { reason: { contains: search } },
        { actor: { contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        include: {
          recoveryCase: {
            include: {
              payment: true,
              customer: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit events' }, { status: 500 });
  }
}
