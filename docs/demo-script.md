# RecoverAI — 5-Minute Panel Demo Script

**Target Audience:** Senior Razorpay Engineering Panel  
**Demo Duration:** 5 minutes  

---

## Pitch Timeline & Script

### 0:00–0:30 — Problem & Context
> *"Failed payments create silent revenue leakage for merchants. When a payment fails, merchants know it happened, but the hard problem is deciding what to do next: retry? send a payment link? escalate? stop? RecoverAI closes that loop with bounded agentic AI."*

- Open Dashboard (`http://localhost:3000`)
- Highlight **₹1.84 Crore Revenue at Risk** across 1,003 failed payment events.

---

### 0:30–2:00 — Live Hero Demo Walkthrough (Hero Scenarios)

#### Scenario A (1-Click Trigger: "Run Hero Scenario A")
- Click **Run Hero Scenario A** on the Dashboard.
- **Story**: Repeat customer Priya Sharma (89% historical success rate) fails a ₹2,499 payment due to `insufficient_funds`.
- **Show Explainable AI UI**:
  - Diagnosis: *"Temporary insufficient balance in customer account."*
  - Confidence: **91%**
  - Why?: Bullet points explaining customer's 8/9 payment history and transient failure mode.
  - Policy Guardrail: **APPROVED BY POLICY**
  - Recovery Action: Official **Razorpay Payment Link** generated (`https://rzp.io/demo/plink_mock_1001`).
  - Result: Customer pays → **₹2,499 Recovered** → Immutable audit trail updated.

#### Scenario B (1-Click Trigger: "Run Hero Scenario B")
- Click **Run Hero Scenario B** on the Dashboard.
- **Story**: High-value ₹75,000 transaction for customer Rohan Mehta fails due to `bank_timeout`.
- **Show Bounded Autonomy**:
  - AI recommends Payment Link recovery.
  - Policy Engine triggers guardrail: **BLOCKED BY GUARDRAIL (`HIGH_VALUE_ESCALATION`)**.
  - Reason: Amount ₹75,000 exceeds ₹50,000 threshold.
  - Action: Automatically routed to **Human Escalation Queue** for operator approval.

#### Scenario C (1-Click Trigger: "Run Hero Scenario C")
- Click **Run Hero Scenario C** on the Dashboard.
- **Story**: Repeatedly failing customer Amit Kumar has reached 3/3 retry attempts.
- **Show Stopping Rules**:
  - Stopping condition triggers: **`MAX_ATTEMPTS_REACHED`**.
  - Automation halts with explicit audit reason to prevent customer spamming and infinite retry loops.

---

### 2:00–3:00 — Agentic Workflow Trace (`/agent`)
- Navigate to **Agent Trace** page (`/agent`).
- Show step-by-step tool execution trace (`get_payment_context` → `calculate_revenue_risk` → `diagnose_failure` → `check_policy` → `create_payment_link` → `record_outcome`).
- Explain: *"The LLM never directly touches payment rails. Every financial action must pass through our typed tool interface and 9 deterministic policy guardrails."*

---

### 3:00–4:00 — Evaluation & Measured Recovery (`/evaluation`)
- Navigate to **Evaluation** page (`/evaluation`).
- Highlight comparative metrics on 300 held-out cases:
  - Baseline Natural Recovery: **₹7.86 Lakh**
  - RecoverAI Recovered Revenue: **₹16.01 Lakh**
  - Net Value Lift: **+₹8.15 Lakh (+103.8% Lift)**
- Show CLI command reproducibility: `npm run evaluate -- --seed 42`.
- Point out explicit transparency label: *"Evaluation on synthetic held-out dataset"*.

---

### 4:00–5:00 — Engineering & Tech Stack Summary
- Summary of architecture: Next.js App Router, TypeScript, SQLite + Prisma, Google Gemini API, Razorpay Test Mode API, Vitest test suite.
- Invite questions from the engineering panel.
