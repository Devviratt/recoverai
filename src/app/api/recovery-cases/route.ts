// ─── RecoverAI Cases List API ──────────────────────────────────────────────────
// GET /api/recovery-cases — List recovery cases with filtering, search & pagination

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const failureReason = searchParams.get('failureReason');
    const action = searchParams.get('action');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const isEvaluation = searchParams.get('isEvaluation');

    const skip = (page - 1) * limit;

    const where: Prisma.RecoveryCaseWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (failureReason) {
      where.payment = {
        failureReason: failureReason,
      };
    }

    if (action) {
      where.recommendedAction = action;
    }

    if (isEvaluation !== null && isEvaluation !== undefined) {
      where.isEvaluation = isEvaluation === 'true';
    }

    if (minAmount || maxAmount) {
      where.revenueAtRisk = {
        ...(minAmount ? { gte: parseFloat(minAmount) } : {}),
        ...(maxAmount ? { lte: parseFloat(maxAmount) } : {}),
      };
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { payment: { externalId: { contains: search } } },
        { payment: { orderId: { contains: search } } },
        { customer: { name: { contains: search } } },
        { customer: { email: { contains: search } } },
        { customer: { externalId: { contains: search } } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.recoveryCase.findMany({
        where,
        include: {
          payment: true,
          customer: true,
          aiAnalyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          policyDecisions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          recoveryActions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.recoveryCase.count({ where }),
    ]);

    return NextResponse.json({
      cases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Cases API] Error listing cases:', error);
    return NextResponse.json({ error: 'Failed to fetch recovery cases' }, { status: 500 });
  }
}
