// ─── RecoverAI Recovery Simulator ────────────────────────────────────────────────
// Deterministic simulator for demo/evaluation mode.
// Simulates recovery outcomes based on realistic probabilities.
//
// When a seed is provided, results are fully reproducible:
//   npm run evaluate -- --seed 42
//
// The simulator determines whether each intervention succeeds based on:
//   1. Customer historical success rate
//   2. Intervention type effectiveness
//   3. Failure category recoverability
//   4. Retry count (diminishing returns)
//   5. Time since failure (urgency decay)

// ─── Seeded RNG (same as seed.ts) ──────────────────────────────────────────────

function createRNG(seed: number) {
  let state = seed;
  return {
    next(): number {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

// ─── Intervention Effectiveness ────────────────────────────────────────────────

const INTERVENTION_EFFECTIVENESS: Record<string, number> = {
  RETRY: 0.35,
  PAYMENT_LINK: 0.55,
  REMINDER: 0.25,
  ALT_METHOD: 0.40,
  ESCALATE: 0.60, // Human handling has higher success
  STOP: 0.0,
};

// ─── Failure Recoverability Rates ──────────────────────────────────────────────

const FAILURE_RECOVERABILITY: Record<string, number> = {
  insufficient_funds: 0.70,
  bank_timeout: 0.75,
  network_error: 0.80,
  authentication_failed: 0.45,
  daily_limit_exceeded: 0.65,
  card_declined: 0.40,
  technical_error: 0.60,
  international_card_blocked: 0.30,
  invalid_card: 0.25,
  card_expired: 0.20,
  suspected_fraud: 0.05,
  account_closed: 0.02,
};

// ─── Baseline Recovery Rate ─────────────────────────────────────────────────────
// This is the rate at which payments would recover WITHOUT any intervention
// (e.g., customer retries on their own)

const BASELINE_RECOVERY_RATE = 0.12; // 12% natural recovery

// ─── Simulation Input ──────────────────────────────────────────────────────────

export interface SimulationInput {
  paymentId: string;
  amount: number;
  failureReason: string;
  customerSuccessRate: number;
  interventionType: string;
  retryCount: number;
  hoursSinceFailure: number;
}

export interface SimulationResult {
  paymentId: string;
  amount: number;
  recovered: boolean;
  recoveredAmount: number;
  interventionType: string;
  baselineWouldRecover: boolean;
  probability: number;
}

// ─── Simulate Single Recovery ──────────────────────────────────────────────────

export function simulateRecovery(
  input: SimulationInput,
  rng: ReturnType<typeof createRNG>
): SimulationResult {
  // Calculate recovery probability
  const interventionEffect = INTERVENTION_EFFECTIVENESS[input.interventionType] || 0;
  const failureRecoverability = FAILURE_RECOVERABILITY[input.failureReason] || 0.3;

  // Combined probability
  let probability =
    interventionEffect * 0.4 +
    failureRecoverability * 0.3 +
    input.customerSuccessRate * 0.3;

  // Diminishing returns for retries
  probability *= Math.pow(0.7, input.retryCount);

  // Urgency decay — acting sooner is better
  probability *= Math.exp(-input.hoursSinceFailure / 72); // half-life ~50 hours

  // Clamp probability
  probability = Math.max(0.01, Math.min(0.95, probability));

  // Determine outcome
  const roll = rng.next();
  const recovered = roll < probability;

  // Baseline check
  const baselineRoll = rng.next();
  const baselineWouldRecover = baselineRoll < BASELINE_RECOVERY_RATE;

  return {
    paymentId: input.paymentId,
    amount: input.amount,
    recovered,
    recoveredAmount: recovered ? input.amount : 0,
    interventionType: input.interventionType,
    baselineWouldRecover,
    probability,
  };
}

// ─── Batch Simulation ──────────────────────────────────────────────────────────

export interface BatchSimulationResult {
  results: SimulationResult[];
  totalAtRisk: number;
  totalRecovered: number;
  recoveryRate: number;
  recoveryValueRate: number;
  baselineRecovery: number;
  additionalRecovery: number;
  recoveryValueLift: number;
  seed: number;
}

export function simulateBatch(
  inputs: SimulationInput[],
  seed: number = 42
): BatchSimulationResult {
  const rng = createRNG(seed);
  const results = inputs.map((input) => simulateRecovery(input, rng));

  const totalAtRisk = results.reduce((sum, r) => sum + r.amount, 0);
  const totalRecovered = results.reduce((sum, r) => sum + r.recoveredAmount, 0);
  const baselineRecovery = results
    .filter((r) => r.baselineWouldRecover)
    .reduce((sum, r) => sum + r.amount, 0);
  const additionalRecovery = totalRecovered - baselineRecovery;

  return {
    results,
    totalAtRisk,
    totalRecovered,
    recoveryRate: results.length > 0 ? results.filter((r) => r.recovered).length / results.length : 0,
    recoveryValueRate: totalAtRisk > 0 ? totalRecovered / totalAtRisk : 0,
    baselineRecovery,
    additionalRecovery: Math.max(0, additionalRecovery),
    recoveryValueLift: baselineRecovery > 0 ? ((totalRecovered - baselineRecovery) / baselineRecovery) * 100 : 0,
    seed,
  };
}

export { createRNG };
