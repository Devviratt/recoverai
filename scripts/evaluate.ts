// ─── RecoverAI Evaluation CLI Script ───────────────────────────────────────────
// Reproducible CLI evaluation script.
// Run with:
//   npx tsx scripts/evaluate.ts --seed=42

import { PrismaClient } from '@prisma/client';
import { simulateBatch, type SimulationInput } from '../src/lib/evaluation/simulator';

const prisma = new PrismaClient();

async function runCLIEvaluation() {
  const seedArg = process.argv.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : 42;

  console.log('\n=======================================================');
  console.log('       RecoverAI — Evaluation & Benchmark CLI');
  console.log('=======================================================\n');

  // Fetch held-out evaluation set (isEvaluation = true)
  const evalCases = await prisma.recoveryCase.findMany({
    where: { isEvaluation: true },
    include: {
      payment: true,
      customer: true,
    },
  });

  if (evalCases.length === 0) {
    console.log('❌ No evaluation cases found. Please seed the database first using `npx tsx prisma/seed.ts`');
    process.exit(1);
  }

  const simulationInputs: SimulationInput[] = evalCases.map((c) => {
    const hoursSinceFailure =
      (Date.now() - c.payment.createdAt.getTime()) / (1000 * 60 * 60);

    return {
      paymentId: c.payment.externalId,
      amount: c.payment.amount,
      failureReason: c.payment.failureReason || 'insufficient_funds',
      customerSuccessRate: c.customer.successRate,
      interventionType: c.recommendedAction || 'PAYMENT_LINK',
      retryCount: c.recoveryAttempts,
      hoursSinceFailure,
    };
  });

  const batchResult = simulateBatch(simulationInputs, seed);

  console.log(`  Seed:                             ${seed}`);
  console.log(`  Evaluation Set Size:              ${evalCases.length} cases`);
  console.log(`  Total Revenue at Risk:            ₹${batchResult.totalAtRisk.toLocaleString('en-IN')}`);
  console.log(`  RecoverAI Recovered Revenue:      ₹${batchResult.totalRecovered.toLocaleString('en-IN')}`);
  console.log(`  RecoverAI Recovery Rate (Count):   ${(batchResult.recoveryRate * 100).toFixed(1)}%`);
  console.log(`  RecoverAI Recovery Rate (Value):   ${(batchResult.recoveryValueRate * 100).toFixed(1)}%`);
  console.log('-------------------------------------------------------');
  console.log(`  Baseline (No Intervention):       ₹${batchResult.baselineRecovery.toLocaleString('en-IN')}`);
  console.log(`  Net Additional Revenue Recovered:  ₹${batchResult.additionalRecovery.toLocaleString('en-IN')}`);
  console.log(`  Recovery Value Lift over Baseline: +${batchResult.recoveryValueLift.toFixed(1)}%`);
  console.log('=======================================================\n');
  console.log('  [NOTICE]: Evaluation performed on synthetic held-out test set.\n');
}

runCLIEvaluation()
  .catch((e) => {
    console.error('Evaluation error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
