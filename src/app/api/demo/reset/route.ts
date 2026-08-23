// ─── RecoverAI Reset / Re-seed API ─────────────────────────────────────────────
// POST /api/demo/reset — Reset dataset and re-run seed script

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const seed = body.seed || 42;

    console.log(`[Reset API] Re-seeding database with seed ${seed}...`);

    const { stdout, stderr } = await execAsync(`npx tsx prisma/seed.ts --seed=${seed}`, {
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      message: 'Demo dataset successfully reset & re-seeded',
      stdout,
      stderr,
    });
  } catch (error) {
    console.error('[Reset API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset demo dataset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
