// ─── RecoverAI Demo Run Agent API ───────────────────────────────────────────────
// POST /api/demo/run-agent — Process eligible at-risk cases with RecoverAI agent

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runRecoveryAgent } from '@/lib/recovery/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const count = parseInt(body.count || '10', 10); // default process 10 cases

    // Find eligible AT_RISK cases
    const eligibleCases = await prisma.recoveryCase.findMany({
      where: {
        status: 'AT_RISK',
      },
      take: count,
    });

    if (eligibleCases.length === 0) {
      return NextResponse.json({
        message: 'No pending AT_RISK cases to process.',
        processedCount: 0,
      });
    }

    const results = [];

    for (const c of eligibleCases) {
      try {
        const trace = await runRecoveryAgent(c.id);
        results.push({ caseId: c.id, success: true, decision: trace.decision, status: trace.finalStatus });
      } catch (err) {
        console.error(`Error processing case ${c.id}:`, err);
        results.push({ caseId: c.id, success: false, error: err instanceof Error ? err.message : 'Unknown' });
      }
    }

    const successfulRuns = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      successfulRuns,
      results,
    });
  } catch (error) {
    console.error('[Run Agent API] Error:', error);
    return NextResponse.json({ error: 'Failed to run recovery agent batch' }, { status: 500 });
  }
}
