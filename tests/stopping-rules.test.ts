import { describe, it, expect } from 'vitest';
import { checkStoppingRules, type StoppingContext } from '../src/lib/engines/stopping-rules';

describe('Stopping Rules Engine', () => {
  const baseContext: StoppingContext = {
    recoveryAttempts: 0,
    maxAttempts: 3,
    isRecovered: false,
    aiConfidence: 0.85,
    consecutiveFailures: 0,
    customerRecentFailures: 1,
    paymentLinkExpired: false,
    hasCompliantActionRemaining: true,
    isManualStop: false,
    lastActionResult: null,
  };

  it('should not stop when all conditions are within normal bounds', () => {
    const result = checkStoppingRules(baseContext);
    expect(result.shouldStop).toBe(false);
  });

  it('should stop immediately when payment is recovered', () => {
    const result = checkStoppingRules({ ...baseContext, isRecovered: true });
    expect(result.shouldStop).toBe(true);
    expect(result.rule).toBe('SUCCESSFUL_RECOVERY');
  });

  it('should stop when maximum attempts reached (3/3)', () => {
    const result = checkStoppingRules({ ...baseContext, recoveryAttempts: 3 });
    expect(result.shouldStop).toBe(true);
    expect(result.rule).toBe('MAX_ATTEMPTS_REACHED');
  });

  it('should stop when customer has too many recent failures (consecutive >= 3)', () => {
    const result = checkStoppingRules({ ...baseContext, consecutiveFailures: 3, customerRecentFailures: 6 });
    expect(result.shouldStop).toBe(true);
    expect(result.rule).toBe('CUSTOMER_REPEATED_FAILURES');
  });

  it('should stop when no compliant recovery action remains', () => {
    const result = checkStoppingRules({ ...baseContext, hasCompliantActionRemaining: false });
    expect(result.shouldStop).toBe(true);
    expect(result.rule).toBe('NO_COMPLIANT_ACTION');
  });
});
