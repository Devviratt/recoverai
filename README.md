# RecoverAI — AI Revenue Recovery Agent

Built for **Razorpay AI Buildathon 2026 — Track 3: AI Revenue Recovery**.

RecoverAI is a production-quality AI Revenue Recovery Agent that detects revenue at risk from failed payment events, diagnoses root causes, selects bounded recovery interventions, executes workflows via Razorpay Test Mode APIs, measures money recovered, enforces deterministic policy guardrails and stopping rules, and maintains an immutable audit trail.

---

## 🎯 Why RecoverAI Fits Track 03 (Razorpay AI Buildathon)

| Track 03 Core Requirement | RecoverAI System Component | Engineering Implementation |
| :--- | :--- | :--- |
| **1. Revenue-at-risk detection** | Revenue Risk Engine (`risk-engine.ts`) | Multi-factor risk scoring formula (0–100 score, priority classification `LOW`..`CRITICAL`) |
| **2. Root-cause diagnosis** | AI Reasoning Layer (`gemini-provider.ts` / `mock-provider.ts`) | Semantic diagnosis of payment failure reason, customer history, and failure recoverability |
| **3. Right intervention determination** | Recovery Strategy Engine (`recovery-strategy-engine.ts`) | Calculates candidate probabilities & expected recovery values (INR), selecting highest expected compliant strategy |
| **4. Bounded recovery execution** | Policy Engine (`policy-engine.ts`) & Typed Tools (`agent.ts`) | 9 deterministic guardrail rules. The LLM never executes payment actions directly without guardrail approval |
| **5. Measured money recovered across batch** | Batch Recovery Engine & Evaluation (`simulator.ts` / `run-batch`) | Real DB measured batch recovery + 300-case held-out benchmark ($+103.8\%$ Value Lift over baseline) |
| **6. Compliant escalation** | Human Escalation Queue (`/escalations`) | High-value payments ($\ge ₹50,000$) or policy blocks route to human operator review center |
| **7. Explicit stopping rules** | Stopping Rules Engine (`stopping-rules.ts`) | 7 explicit halting conditions (`MAX_ATTEMPTS_REACHED`, `SUCCESSFUL_RECOVERY`, `CUSTOMER_REPEATED_FAILURES`) |
| **8. Complete audit trail** | Append-Only Audit Trail (`prisma.auditEvent`) | Every state transition, reasoning step, policy check, and tool invocation logged with actor & timestamp |

---

> **Synthetic Evaluation Disclaimer**: Evaluation performed on synthetic held-out test dataset (300 payment cases, seed 42). Metrics represent simulated deterministic outcomes for benchmark reproducibility. No live Razorpay merchant money or real customer data is fabricated.

---

## 🚀 Key Features & Architectural Highlights

- **10-Step Revenue Recovery Flow**: `Payment Failure Event → Risk Detection → Diagnosis → Eligibility → AI Decision → Policy Engine Validation → Recovery Action → Outcome Tracking → Money Recovered → Audit Trail`.
- **Hybrid AI Engine**: Deterministic Revenue Risk Scoring Engine (0-100 score + Priority) paired with Google Gemini (with deterministic Mock Provider fallback).
- **Deterministic Policy & Guardrail Engine**: 9 policy rules enforcing bounded autonomy. The LLM **never** directly executes payment actions without passing guardrails.
- **Explicit Stopping Rules**: Automated recovery halts when max attempts (3/3) are reached, payment is recovered, or AI confidence drops below threshold.
- **Human Escalation Queue**: High-value transactions (≥ ₹50,000) or low-confidence cases route to human operator queue for approval.
- **Razorpay Test Mode Integration**: Uses official documented Razorpay API endpoints (`https://api.razorpay.com/v1/payment_links`) for payment link creation.
- **Reproducible Evaluation**: Includes 300 held-out evaluation cases seed-reproducible via `npm run evaluate -- --seed 42` showing **+103.8% Net Revenue Value Lift** over baseline.
- **Zero-Setup Local Experience**: Uses SQLite + Prisma ORM so judges can run `npm install && npm run dev` immediately without database setup or API keys.

---

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Database**: SQLite (via Prisma ORM 5.22)
- **AI Provider**: Google Gemini API (structured JSON output with Zod schema validation) + Mock AI Provider
- **Payment Provider**: Razorpay Test Mode API (`/v1/payment_links`) + Mock Payment Provider
- **Testing**: Vitest (Unit & Integration tests)

---

## ⚡ Quick Start (Zero Setup Required)

### 1. Clone & Install Dependencies

```bash
cd recoverai
npm install
```

### 2. Set Up Database & Seed Demo Data

```bash
npm run db:setup
npm run db:seed
```

This generates **1,003 synthetic payment events** (including 3 hero scenarios) with ₹1.84 Crore revenue at risk.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎬 5-Minute Pitch Hero Scenario Walkthrough

The application includes 1-click launchers for the 3 Hero Scenarios required for the Razorpay panel presentation:

1. **Scenario A (Successful Recovery)**: Repeat customer Priya Sharma fails a ₹2,499 payment due to `insufficient_funds`. AI diagnoses temporary failure (91% confidence), policy approves, generates Razorpay Payment Link, customer pays → **₹2,499 Recovered**.
2. **Scenario B (Bounded Autonomy Guardrail)**: High-value ₹75,000 payment for customer Rohan Mehta fails due to `bank_timeout`. Policy engine blocks automatic execution (`HIGH_VALUE_ESCALATION` threshold ₹50,000) and routes to **Human Escalation Queue**.
3. **Scenario C (Stopping Rule Trigger)**: Customer Amit Kumar reaches 3/3 retry attempts. Stopping rule `MAX_ATTEMPTS_REACHED` triggers and halts automation with explicit audit trail reason.

---

## 📊 Evaluation Benchmark Reproducibility

To verify evaluation metrics on the 300 held-out test set:

```bash
npm run evaluate -- --seed=42
```

### Measured Benchmark Summary (Seed 42):
- **Total Revenue at Risk**: ₹61,91,571
- **RecoverAI Recovered Revenue**: **₹16,01,882** (25.9% Value Recovery Rate)
- **Baseline Natural Recovery (No Intervention)**: ₹7,86,151 (12.7% Rate)
- **Net Additional Revenue Recovered**: **+₹8,15,731**
- **Recovery Value Lift over Baseline**: **+103.8% Lift (2.04x)**

*Note: All evaluation data is explicitly labeled as synthetic controlled test data.*

---

## 🧪 Testing & Verification Commands

```bash
npm run test        # Runs Vitest unit & integration test suite (14 tests)
npx tsc --noEmit    # Runs TypeScript type check (0 errors)
npm run build       # Builds Next.js production bundle (16 pages compiled)
```

---

## 📂 Project Structure

```text
recoverai/
├── docs/
│   ├── PRD.md              # Product Requirements Document
│   ├── architecture.md     # Architecture & ASCII Flow Diagrams
│   ├── evaluation.md       # Evaluation Benchmark & Reproducibility Report
│   └── demo-script.md      # 5-Minute Panel Pitch Demo Script
├── prisma/
│   ├── schema.prisma       # Database models (SQLite + Prisma)
│   └── seed.ts             # Seed script generating 1,003 synthetic payment events
├── prompts/
│   └── recovery-agent-v1.md # Versioned AI System Prompt
├── scripts/
│   └── evaluate.ts         # CLI evaluation script (npm run evaluate)
├── src/
│   ├── app/                # Next.js App Router pages & API routes
│   ├── components/         # React UI components (Navbar, Badges, HeroScenarioCards)
│   └── lib/
│       ├── ai/             # Gemini & Mock AI Providers with Zod schema
│       ├── engines/        # Risk Engine, Policy Engine, Stopping Rules, Eligibility Engine
│       ├── providers/      # Razorpay Test Mode & Mock Payment Providers
│       ├── recovery/       # Recovery Agentic Loop & State Machine
│       └── db.ts           # Prisma client singleton
└── tests/                  # Vitest unit test suite
```
