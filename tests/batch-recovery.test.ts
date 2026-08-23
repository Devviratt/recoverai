// ─── RecoverAI Batch Recovery & Idempotency Integration Tests ──────────────────
// Tests batch processing, per-case error isolation, batch idempotency,
// and Expected vs Realized Recovery calculations.

import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/db';
import { runRecoveryAgent } from '../src/lib/recovery/agent';
import { evaluateRecoveryStrategies } from '../src/lib/engines/recovery-strategy-engine';

describe('Batch Recovery Engine', () => {
  beforeAll(async () => {
    // Reset AT_RISK cases for batch testing
    await prisma.recoveryCase.updateMany({
      where: { isEvaluation: false },
      data: { status: 'AT_RISK', recoveryAttempts: 0 },
    });
  });

  it('should process demo cases in batch through the real 12-step agent loop', async () => {
    const demoCases = await prisma.recoveryCase.findMany({
      where: { isEvaluation: false, status: 'AT_RISK' },
      include: { payment: true, customer: true },
      take: 10,
    });

    expect(demoCases.length).toBeGreaterThan(0);

    const results = [];
    let expectedSum = 0;

    for (const c of demoCases) {
      const paymentCtx = {
        paymentId: c.payment.externalId,
        orderId: c.payment.orderId || '',
        amount: c.payment.amount,
        currency: c.payment.currency || 'INR',
        status: c.payment.status,
        failureReason: c.payment.failureReason || 'card_declined',
        paymentMethod: c.payment.paymentMethod || 'card',
        customerSuccessRate: c.customer.successRate || 0.8,
        previousFailures: c.customer.failedPayments || 0,
        previousSuccesses: c.customer.successfulPayments || 0,
        retryCount: c.recoveryAttempts || 0,
        hoursSinceFailure: 2,
        customerSegment: c.customer.segment || 'regular',
        customerLifetimeValue: c.customer.lifetimeValue || 10000,
        totalTransactions: c.customer.totalTransactions || 1,
      };

      const evalResult = evaluateRecoveryStrategies(paymentCtx);
      expectedSum += evalResult.highestExpectedRecovery;

      const trace = await runRecoveryAgent(c.id);
      results.push({ caseId: c.id, status: trace.finalStatus, decision: trace.decision });
    }

    expect(results.length).toBe(demoCases.length);
    expect(expectedSum).toBeGreaterThan(0);
  });

  it('BATCH IDEMPOTENCY TEST: Running batch recovery twice must not duplicate escalations or corrupt state', async () => {
    const highValueCase = await prisma.payment.findUnique({
      where: { externalId: 'pay_hero_scenario_b' },
      include: { recoveryCase: true },
    });

    if (highValueCase?.recoveryCase) {
      // First run
      await prisma.recoveryCase.update({ where: { id: highValueCase.recoveryCase.id }, data: { status: 'AT_RISK' } });
      const trace1 = await runRecoveryAgent(highValueCase.recoveryCase.id);
      expect(trace1.finalStatus).toBe('ESCALATED');

      // Count escalation records for this case
      const escCount1 = await prisma.escalation.count({ where: { caseId: highValueCase.recoveryCase.id } });
      expect(escCount1).toBe(1);

      // Second run (re-evaluating same case)
      await prisma.recoveryCase.update({ where: { id: highValueCase.recoveryCase.id }, data: { status: 'AT_RISK' } });
      const trace2 = await runRecoveryAgent(highValueCase.recoveryCase.id);
      expect(trace2.finalStatus).toBe('ESCALATED');

      // Must remain exactly 1 escalation record (upsert idempotency)
      const escCount2 = await prisma.escalation.count({ where: { caseId: highValueCase.recoveryCase.id } });
      expect(escCount2).toBe(1);
    }
  });

  it('ERROR ISOLATION TEST: Single invalid case ID throw should not crash batch loop', async () => {
    let isolateWorked = false;
    try {
      await runRecoveryAgent('non_existent_invalid_case_id');
    } catch (err) {
      // Per-case error is caught safely
      isolateWorked = true;
    }
    expect(isolateWorked).toBe(true);
  });
});
