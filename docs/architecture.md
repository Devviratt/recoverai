# RecoverAI — Architecture & Technical Design

## 1. System Architecture Diagram

```
                 ┌─────────────────────────────────────────────────┐
                 │          Merchant Operations Dashboard          │
                 │   (Next.js App Router, Tailwind CSS, Recharts)  │
                 └────────────────────────┬────────────────────────┘
                                          │
                                          ▼
                 ┌─────────────────────────────────────────────────┐
                 │           Application API Layer (REST)          │
                 │ (/api/dashboard, /api/recovery-cases, /api/...) │
                 └────────────────────────┬────────────────────────┘
                                          │
        ┌─────────────────────────────────┼────────────────────────────────┐
        ▼                                 ▼                                ▼
┌──────────────┐               ┌─────────────────────┐          ┌───────────────────┐
│ Revenue Risk │               │  Recovery Agent     │          │  Recovery State   │
│    Engine    │               │  (Agentic Loop)     │          │     Machine       │
└───────┬──────┘               └──────────┬──────────┘          └─────────┬─────────┘
        │                                 │                               │
        │                       ┌─────────┴─────────┐                     │
        │                       ▼                   ▼                     │
        │              ┌─────────────────┐ ┌─────────────────┐            │
        │              │  AI Provider    │ │ Policy Engine   │            │
        │              │ (Gemini / Mock) │ │ (Guardrails)    │            │
        │              └────────┬────────┘ └────────┬────────┘            │
        │                       │                   │                     │
        └───────────────────────┼───────────────────┴─────────────────────┘
                                ▼
                 ┌─────────────────────────────────────────────────┐
                 │           Payment Provider Abstraction          │
                 │   (Razorpay Test Mode / Mock Payment Provider)  │
                 └────────────────────────┬────────────────────────┘
                                          │
                                          ▼
                 ┌─────────────────────────────────────────────────┐
                 │              SQLite DB / Prisma ORM             │
                 │    (Payments, Cases, Audit Events, Escalations) │
                 └─────────────────────────────────────────────────┘
```

---

## 2. Component Design & Responsibilities

### 2.1 Agentic Decision Pipeline
1. **Event Reception**: Payment failure event ingested into system.
2. **Context Aggregation**: `AGENT_TOOLS.get_payment_context` fetches customer stats (LTV, success rate, past failures) and payment details.
3. **Risk Scoring**: `calculateRiskScore` generates score (0-100) and assigns priority (`LOW`..`CRITICAL`).
4. **AI Diagnosis**: `GeminiAIProvider` / `MockAIProvider` analyzes context and generates structured JSON response.
5. **Policy Check**: `checkPolicy` validates recommendation against 9 deterministic guardrail rules.
6. **Tool Execution**: `create_payment_link`, `escalate_case`, or `stop_recovery` is invoked.
7. **Audit Event**: Immutable record created in `AuditEvent` table.

### 2.2 Provider Abstractions
- **`AIProvider`**: Interface allowing hot-swapping between `GeminiAIProvider` (live Gemini API) and `MockAIProvider` (deterministic local rule engine).
- **`PaymentProvider`**: Interface allowing hot-swapping between `RazorpayTestProvider` (official Razorpay `/v1` endpoints) and `MockPaymentProvider`.

---

## 3. Database Schema Entity Relationship

- **`Merchant`** 1 ── * **`Customer`**
- **`Customer`** 1 ── * **`Payment`**
- **`Payment`** 1 ── 0..1 **`RecoveryCase`**
- **`RecoveryCase`** 1 ── * **`RecoveryAction`**
- **`RecoveryCase`** 1 ── * **`AIAnalysis`**
- **`RecoveryCase`** 1 ── * **`PolicyDecision`**
- **`RecoveryCase`** 1 ── * **`AuditEvent`**
- **`RecoveryCase`** 1 ── 0..1 **`Escalation`**
