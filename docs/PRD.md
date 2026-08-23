# RecoverAI — Product Requirements Document (PRD)

**Project Name:** RecoverAI  
**Track:** Track 3: AI Revenue Recovery (Razorpay AI Buildathon 2026)  
**Target User:** Merchant / Finance / Revenue Operations Managers  

---

## 1. Problem Statement

Failed payment events create silent revenue leakage for online merchants. When a payment fails, merchants know the payment failed, but the difficult problem is deciding **what action to take next**:
- Should the system automatically retry?
- Should a payment link be generated and sent?
- Should the customer be given a gentle reminder?
- Should an alternative payment method be recommended?
- Should the case be escalated to a human operator?
- When should automated recovery stop?

Unrestricted AI execution on financial rails is dangerous, while static dashboards provide no automation. RecoverAI bridges this gap through **bounded agentic autonomy**.

---

## 2. Core Solution & Flow

RecoverAI executes an automated 10-step recovery loop:

```
Payment Event 
→ Revenue Risk Detection 
→ Customer/Payment Diagnosis 
→ Recovery Eligibility 
→ AI Intervention Decision 
→ Policy/Guardrail Validation 
→ Recovery Action 
→ Outcome Tracking 
→ Money Recovered 
→ Audit Trail
```

---

## 3. Key Functional Modules

### 3.1 Revenue Risk Scoring Engine
Calculates a 0–100 risk score and priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) using a weighted multi-factor formula considering:
- Payment Amount (log-scaled)
- Customer Historical Success Rate
- Failure Mode Recoverability (12 categories)
- Recency (exponential decay)
- Retry Headroom (remaining attempts)
- Customer Segment (regular, premium, enterprise)

### 3.2 AI Diagnosis Layer
Integrates Google Gemini (with mock fallback for offline/demo mode) to generate strict JSON diagnoses including:
- Failure root-cause analysis
- Recommended action (`RETRY`, `PAYMENT_LINK`, `REMINDER`, `ALT_METHOD`, `ESCALATE`, `STOP`)
- Confidence score (0.0–1.0)
- Explainable structured reasoning bullets ("Why?")
- Personalization customer message

### 3.3 Deterministic Policy & Guardrail Engine
The LLM **never** directly executes payment actions. Every recommendation must pass through 9 deterministic rules:
1. `MAX_RETRIES` (max 3 retries)
2. `MAX_RECOVERY_ATTEMPTS` (max 3 automated recovery interventions)
3. `HIGH_VALUE_ESCALATION` (transactions ≥ ₹50,000 escalated to human queue)
4. `LOW_CONFIDENCE_ESCALATION` (AI confidence < 60% escalated)
5. `CUSTOMER_COOLDOWN` (24-hour notification cooldown)
6. `MAX_NOTIFICATIONS` (max 2 customer notifications)
7. `NO_CONCURRENT_ACTIONS` (single active action per case)
8. `EXPIRED_LINK_GUARD` (no reuse of expired payment links)
9. `FRAUD_GUARD` (suspected fraud strictly escalated)

### 3.4 Bounded Recovery Executor & Razorpay Test Mode
Executes bounded tools:
- `create_payment_link`: Calls Razorpay Test Mode API (`POST /v1/payment_links`) to generate official payment links (`rzp.io`)
- `schedule_retry`: Schedules technical retry
- `escalate_case`: Routes to human escalation queue
- `stop_recovery`: Halts automation with audit reason

### 3.5 Immutable Audit Trail & Agent Trace
Logs all agent steps, tool calls, policy evaluations, and state transitions to an unalterable audit log for full explainability.

---

## 4. Acceptance Criteria Status

- [x] Merchant can view revenue at risk and recovered revenue
- [x] Reproducible risk score calculation (0-100)
- [x] Structured AI diagnosis with explainable reasoning
- [x] Policy engine guardrail validation before execution
- [x] Razorpay Test Mode integration & Mock adapter fallback
- [x] Explicit stopping rules visible in UI
- [x] Human escalation queue for high-value & low-confidence cases
- [x] Immutable audit trail for all events
- [x] Held-out evaluation dataset (300 cases, seed 42) with baseline comparison
- [x] Reproducible CLI script (`npm run evaluate -- --seed 42`)
