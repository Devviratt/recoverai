// ─── RecoverAI Gemini AI Provider ──────────────────────────────────────────────
// Uses Google Gemini API for actual AI-powered diagnosis.
// System prompt is versioned in prompts/recovery-agent-v1.md
//
// The AI receives structured payment context and MUST return strict JSON.
// Response is validated with Zod schema before use.

import type { PaymentContext, AIDiagnosis, AIProviderInterface, StrategyComparison } from '@/lib/types';
import { safeParseAIResponse } from '@/lib/ai/schema';
import { MockAIProvider } from '@/lib/ai/mock-provider';

const SYSTEM_PROMPT = `You are RecoverAI, an AI revenue recovery agent for a payment platform.

Your job is to analyze a failed payment and recommend the best recovery action.

You MUST respond with ONLY valid JSON matching this exact schema:
{
  "diagnosis": "string - brief diagnosis of why the payment failed",
  "recommended_action": "RETRY" | "PAYMENT_LINK" | "REMINDER" | "ALT_METHOD" | "ESCALATE" | "STOP",
  "confidence": number between 0 and 1,
  "reasoning": ["array of string reasons for your recommendation"],
  "customer_message": "string - professional message to send to the customer"
}

Action Guidelines:
- RETRY: Only for transient failures (timeout, network) with low retry count
- PAYMENT_LINK: For recoverable failures where customer needs a fresh payment session
- REMINDER: For cases where timing matters (daily limits, temporary holds)
- ALT_METHOD: When the payment method itself is the issue (expired card, blocked)
- ESCALATE: For high-risk, ambiguous, or suspected fraud cases
- STOP: When recovery is inappropriate (closed account, repeated failures)

Rules:
- Be conservative with confidence scores
- Never recommend RETRY for card_expired or account_closed
- Always recommend ESCALATE for suspected_fraud
- Consider customer history heavily — high success rate customers are more recoverable
- Amount matters — be more careful with high-value transactions
- Factor in retry count — more retries = lower confidence
- Keep customer messages professional, concise, and helpful
- Do NOT mention internal system details in customer messages
- Do NOT expose payment failure technical details to customers`;

export class GeminiAIProvider implements AIProviderInterface {
  readonly providerName = 'gemini';
  private apiKey: string;
  private fallback: MockAIProvider;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.fallback = new MockAIProvider();
  }

  async diagnose(context: PaymentContext, strategyComparison?: StrategyComparison): Promise<AIDiagnosis> {
    try {
      const response = await this.callGemini(context, strategyComparison);
      return response;
    } catch (error) {
      console.error('[GeminiAIProvider] Error calling Gemini, falling back to mock:', error);
      return this.fallback.diagnose(context, strategyComparison);
    }
  }

  private async callGemini(context: PaymentContext, strategyComparison?: StrategyComparison): Promise<AIDiagnosis> {
    const userPrompt = `Analyze this failed payment and recommend a recovery action:

Payment Context:
${JSON.stringify({
  payment_id: context.paymentId,
  amount: context.amount,
  currency: context.currency,
  failure_reason: context.failureReason,
  payment_method: context.paymentMethod,
  customer_success_rate: context.customerSuccessRate,
  previous_failures: context.previousFailures,
  previous_successes: context.previousSuccesses,
  retry_count: context.retryCount,
  hours_since_failure: context.hoursSinceFailure,
  customer_segment: context.customerSegment,
  customer_lifetime_value: context.customerLifetimeValue,
  total_transactions: context.totalTransactions,
}, null, 2)}

Recovery Strategy Engine Candidates (Calculated Probabilities & Expected Recovery):
${strategyComparison ? JSON.stringify(strategyComparison, null, 2) : 'N/A'}

Respond with ONLY valid JSON. No markdown, no code blocks, no explanation outside the JSON.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Parse JSON from response
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Could not parse Gemini response as JSON: ${text.slice(0, 200)}`);
      }
    }

    // Validate with Zod schema
    const validated = safeParseAIResponse(parsed);
    if (!validated.success) {
      console.error('[GeminiAIProvider] Schema validation failed:', validated.error.issues);
      throw new Error(`AI response failed schema validation: ${validated.error.message}`);
    }

    return {
      diagnosis: validated.data.diagnosis,
      recommendedAction: validated.data.recommended_action,
      confidence: validated.data.confidence,
      reasoning: validated.data.reasoning,
      customerMessage: validated.data.customer_message,
    };
  }
}
