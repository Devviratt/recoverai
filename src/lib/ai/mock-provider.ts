// ─── RecoverAI Mock AI Provider ─────────────────────────────────────────────────
// Deterministic AI provider for demo/offline mode.
// Uses rule-based logic to generate realistic diagnoses that mirror
// what a real LLM would produce, ensuring the demo works without API keys.

import type { PaymentContext, AIDiagnosis, AIProviderInterface, RecoveryActionType, StrategyComparison } from '@/lib/types';

export class MockAIProvider implements AIProviderInterface {
  readonly providerName = 'mock';

  async diagnose(context: PaymentContext, strategyComparison?: StrategyComparison): Promise<AIDiagnosis> {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));

    const action = strategyComparison?.recommendedAction || this.selectAction(context);
    const confidence = this.calculateConfidence(context, action);
    const diagnosis = this.generateDiagnosis(context);
    const reasoning = this.generateReasoning(context, action, strategyComparison);
    const customerMessage = this.generateCustomerMessage(context, action);

    return {
      diagnosis,
      recommendedAction: action,
      confidence,
      reasoning,
      customerMessage,
    };
  }

  private selectAction(ctx: PaymentContext): RecoveryActionType {
    // Suspected fraud → always escalate
    if (ctx.failureReason === 'suspected_fraud') return 'ESCALATE';

    // Account closed → stop
    if (ctx.failureReason === 'account_closed') return 'STOP';

    // Too many retries → escalate or stop
    if (ctx.retryCount >= 3) return 'STOP';
    if (ctx.retryCount >= 2 && ctx.customerSuccessRate < 0.5) return 'ESCALATE';

    // Card expired / invalid → suggest alt payment method
    if (ctx.failureReason === 'card_expired' || ctx.failureReason === 'invalid_card') {
      return 'ALT_METHOD';
    }

    // International card blocked → alt method
    if (ctx.failureReason === 'international_card_blocked') return 'ALT_METHOD';

    // Bank timeout / network error → retry if first attempt
    if (
      (ctx.failureReason === 'bank_timeout' || ctx.failureReason === 'network_error') &&
      ctx.retryCount === 0
    ) {
      return 'RETRY';
    }

    // Insufficient funds with good history → payment link
    if (ctx.failureReason === 'insufficient_funds' && ctx.customerSuccessRate > 0.6) {
      return 'PAYMENT_LINK';
    }

    // Daily limit exceeded → reminder (try tomorrow)
    if (ctx.failureReason === 'daily_limit_exceeded') return 'REMINDER';

    // Auth failed → payment link with clear instructions
    if (ctx.failureReason === 'authentication_failed') return 'PAYMENT_LINK';

    // Good customer history → payment link
    if (ctx.customerSuccessRate > 0.7 && ctx.previousSuccesses > 3) {
      return 'PAYMENT_LINK';
    }

    // Low success rate → escalate
    if (ctx.customerSuccessRate < 0.3) return 'ESCALATE';

    // Default for remaining card_declined etc.
    if (ctx.retryCount === 0 && ctx.hoursSinceFailure < 6) return 'RETRY';

    return 'PAYMENT_LINK';
  }

  private calculateConfidence(ctx: PaymentContext, action: RecoveryActionType): number {
    let base = 0.7;

    // Higher confidence for customers with good history
    if (ctx.customerSuccessRate > 0.8) base += 0.15;
    else if (ctx.customerSuccessRate > 0.6) base += 0.08;
    else if (ctx.customerSuccessRate < 0.3) base -= 0.2;

    // Transient failures → higher confidence
    const transientReasons = ['bank_timeout', 'network_error', 'insufficient_funds', 'daily_limit_exceeded'];
    if (transientReasons.includes(ctx.failureReason)) base += 0.05;

    // Permanent-looking failures → lower confidence
    if (['account_closed', 'suspected_fraud'].includes(ctx.failureReason)) base -= 0.3;
    if (['invalid_card', 'card_expired'].includes(ctx.failureReason)) base -= 0.1;

    // More retries → lower confidence
    base -= ctx.retryCount * 0.08;

    // Escalation/stop get moderate confidence
    if (action === 'ESCALATE') base = Math.min(base, 0.75);
    if (action === 'STOP') base = Math.min(base, 0.85);

    return Math.max(0.1, Math.min(0.98, base));
  }

  private generateDiagnosis(ctx: PaymentContext): string {
    const diagnoses: Record<string, string> = {
      insufficient_funds: 'Temporary insufficient balance in customer account. Customer has a strong payment history suggesting this is transient.',
      card_declined: 'Card was declined by the issuing bank. This may be due to temporary bank-side restrictions or spending limits.',
      bank_timeout: 'Bank gateway timed out during payment processing. This is a transient infrastructure issue unrelated to the customer.',
      authentication_failed: 'Customer was unable to complete authentication (3DS/OTP). This may be due to OTP delivery issues or session timeout.',
      invalid_card: 'Card details entered are invalid. Customer may need to re-enter correct card information or use a different payment method.',
      card_expired: 'Customer card has expired. They need to update their payment method to complete the transaction.',
      network_error: 'Payment failed due to a network connectivity issue. This is a transient error that is likely to succeed on retry.',
      international_card_blocked: 'International transactions are not enabled on the customer\'s card. Customer needs to enable international payments or use an alternative method.',
      daily_limit_exceeded: 'Customer has exceeded their daily transaction limit. Payment is likely to succeed after the limit resets.',
      suspected_fraud: 'Transaction was flagged by fraud detection systems. Manual review is required before any recovery action.',
      account_closed: 'Customer bank account appears to be closed. Automated recovery is not possible.',
      technical_error: 'Payment failed due to a technical error in the payment processing system. This is transient and likely to succeed on retry.',
    };

    return diagnoses[ctx.failureReason] ?? 'Payment failure requires further analysis.';
  }

  private generateReasoning(ctx: PaymentContext, action: RecoveryActionType, strategyComparison?: StrategyComparison): string[] {
    const reasons: string[] = [];

    if (strategyComparison) {
      reasons.push(`Strategy Engine Recommendation: ${strategyComparison.decisionReason}`);
    }

    // Customer history
    if (ctx.customerSuccessRate > 0.7) {
      reasons.push(`Customer has a strong payment history (${(ctx.customerSuccessRate * 100).toFixed(0)}% success rate across ${ctx.totalTransactions} transactions)`);
    } else if (ctx.customerSuccessRate > 0.4) {
      reasons.push(`Customer has moderate payment history (${(ctx.customerSuccessRate * 100).toFixed(0)}% success rate)`);
    } else {
      reasons.push(`Customer has poor payment history (${(ctx.customerSuccessRate * 100).toFixed(0)}% success rate) — recovery may be unlikely`);
    }

    // Failure analysis
    const transient = ['bank_timeout', 'network_error', 'technical_error', 'insufficient_funds'];
    if (transient.includes(ctx.failureReason)) {
      reasons.push(`Failure reason "${ctx.failureReason.replace(/_/g, ' ')}" is typically transient and recoverable`);
    } else {
      reasons.push(`Failure reason "${ctx.failureReason.replace(/_/g, ' ')}" may require customer action`);
    }

    // Amount context
    if (ctx.amount > 50000) {
      reasons.push(`High-value transaction (₹${ctx.amount.toLocaleString('en-IN')}) — requires careful handling`);
    } else if (ctx.amount < 500) {
      reasons.push(`Low-value transaction (₹${ctx.amount.toLocaleString('en-IN')}) — standard recovery`);
    } else {
      reasons.push(`Payment amount ₹${ctx.amount.toLocaleString('en-IN')} is within normal range for this customer`);
    }

    // Action-specific reasoning
    switch (action) {
      case 'RETRY':
        reasons.push('Retry is appropriate because the failure appears transient and retry count is low');
        break;
      case 'PAYMENT_LINK':
        reasons.push('Payment link allows the customer to complete payment at their convenience with a fresh session');
        break;
      case 'REMINDER':
        reasons.push('A gentle reminder is appropriate as immediate action is not critical');
        break;
      case 'ALT_METHOD':
        reasons.push('Suggesting an alternative payment method because the current method has a persistent issue');
        break;
      case 'ESCALATE':
        reasons.push('Case requires human review due to complexity, risk level, or policy constraints');
        break;
      case 'STOP':
        reasons.push('Further automated recovery would be inappropriate given the current state');
        break;
    }

    // Retry context
    if (ctx.retryCount > 0) {
      reasons.push(`${ctx.retryCount} previous recovery attempt(s) have been made`);
    }

    return reasons;
  }

  private generateCustomerMessage(ctx: PaymentContext, action: RecoveryActionType): string {
    const amount = `₹${ctx.amount.toLocaleString('en-IN')}`;

    switch (action) {
      case 'PAYMENT_LINK':
        return `Hi, your recent payment of ${amount} could not be completed. We've created a secure payment link for you to complete this transaction at your convenience. The link is valid for 24 hours.`;
      case 'RETRY':
        return `We noticed your payment of ${amount} didn't go through. We're automatically retrying the transaction for you.`;
      case 'REMINDER':
        return `Just a reminder — your payment of ${amount} is still pending. Please try again when convenient.`;
      case 'ALT_METHOD':
        return `Your payment of ${amount} could not be processed with your current payment method. Please try using an alternative payment method such as UPI or netbanking.`;
      case 'ESCALATE':
        return `We're reviewing your payment of ${amount}. Our team will reach out to assist you shortly.`;
      case 'STOP':
        return `We noticed an issue with your payment of ${amount}. If you need assistance, please contact our support team.`;
      default:
        return `Your payment of ${amount} requires attention. Please contact support for assistance.`;
    }
  }
}
