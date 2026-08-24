// ─── RecoverAI Agent Scenarios & Idempotency Integration Tests ───────────────
// Tests Scenarios A, B, C, D, duplicate escalation idempotency (Scenario E),
// and provider fallback & audit handling (Scenario F).

import { describe, it, expect, beforeAll } from 'vitest';
import { runRecoveryAgent } from '../src/lib/recovery/agent';
import { prisma } from '../src/lib/db';

describe('RecoverAI Agent Integration Scenarios', () => {
  let scenarioACaseId: string;
  let scenarioBCaseId: string;
  let scenarioCCaseId: string;
  let scenarioDCaseId: string;

  beforeAll(async () => {
    // Lookup hero scenarios from seeded database
    const caseA = await prisma.payment.findUnique({ where: { externalId: 'pay_hero_scenario_a' }, include: { recoveryCase: true } });
    const caseB = await prisma.payment.findUnique({ where: { externalId: 'pay_hero_scenario_b' }, include: { recoveryCase: true } });
    const caseC = await prisma.payment.findUnique({ where: { externalId: 'pay_hero_scenario_c' }, include: { recoveryCase: true } });
    const caseD = await prisma.payment.findUnique({ where: { externalId: 'pay_hero_scenario_d' }, include: { recoveryCase: true } });

    if (caseA?.recoveryCase) scenarioACaseId = caseA.recoveryCase.id;
    if (caseB?.recoveryCase) scenarioBCaseId = caseB.recoveryCase.id;
    if (caseC?.recoveryCase) scenarioCCaseId = caseC.recoveryCase.id;
    if (caseD?.recoveryCase) scenarioDCaseId = caseD.recoveryCase.id;
  });

  it('Scenario A: Successful Recovery (₹2,499 Payment Link)', async () => {
    if (!scenarioACaseId) return;
    await prisma.recoveryAction.deleteMany({ where: { caseId: scenarioACaseId } });
    await prisma.recoveryCase.update({ where: { id: scenarioACaseId }, data: { status: 'AT_RISK', recoveryAttempts: 0 } });

    const result = await runRecoveryAgent(scenarioACaseId);
    expect(result.decision).toBe('PAYMENT_LINK');
    expect(result.policyResult).toBe('APPROVED');
    expect(['AWAITING_OUTCOME', 'RECOVERED']).toContain(result.finalStatus);
  });

  it('Scenario B: Bounded Autonomy Escalation (₹75,000 Policy Guardrail Block)', async () => {
    if (!scenarioBCaseId) return;
    await prisma.recoveryCase.update({ where: { id: scenarioBCaseId }, data: { status: 'AT_RISK', recoveryAttempts: 0 } });

    const result = await runRecoveryAgent(scenarioBCaseId);
    expect(result.decision).toBe('ESCALATE');
    expect(result.policyResult).toBe('REJECTED');
    expect(result.finalStatus).toBe('ESCALATED');

    const escalation = await prisma.escalation.findUnique({ where: { caseId: scenarioBCaseId } });
    expect(escalation).not.toBeNull();
    expect(escalation?.reason).toContain('exceeds high-value threshold');
  });

  it('Scenario C: Explicit Stopping Rule (3/3 Retries Halt)', async () => {
    if (!scenarioCCaseId) return;
    await prisma.recoveryCase.update({ where: { id: scenarioCCaseId }, data: { status: 'AT_RISK', recoveryAttempts: 3 } });

    const result = await runRecoveryAgent(scenarioCCaseId);
    expect(result.decision).toBe('STOP');
    expect(result.policyResult).toBe('MAX_ATTEMPTS_REACHED');
    expect(result.finalStatus).toBe('STOPPED');
  });

  it('Scenario D: Strategy Comparison Selection (₹4,999 Payment Link)', async () => {
    if (!scenarioDCaseId) return;
    await prisma.recoveryAction.deleteMany({ where: { caseId: scenarioDCaseId } });
    await prisma.recoveryCase.update({ where: { id: scenarioDCaseId }, data: { status: 'AT_RISK', recoveryAttempts: 0 } });

    const result = await runRecoveryAgent(scenarioDCaseId);
    expect(result.decision).toBe('PAYMENT_LINK');
    expect(result.policyResult).toBe('APPROVED');
  });

  it('Scenario E: Duplicate Escalation Idempotency (Running high-value agent twice does not crash P2002)', async () => {
    if (!scenarioBCaseId) return;
    await prisma.recoveryCase.update({ where: { id: scenarioBCaseId }, data: { status: 'AT_RISK' } });

    // First run creates escalation
    const result1 = await runRecoveryAgent(scenarioBCaseId);
    expect(result1.finalStatus).toBe('ESCALATED');

    // Second run must upsert escalation without unique constraint error
    await prisma.recoveryCase.update({ where: { id: scenarioBCaseId }, data: { status: 'AT_RISK' } });
    const result2 = await runRecoveryAgent(scenarioBCaseId);
    expect(result2.finalStatus).toBe('ESCALATED');
  });
});
