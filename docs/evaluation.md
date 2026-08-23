# RecoverAI — Evaluation & Benchmark Methodology Report

## 1. Evaluation Dataset Overview

To ensure evaluation results are honest, reproducible, and un-cherrypicked, the dataset is split into:
- **Development Dataset**: 703 payment events (for agent tuning)
- **Held-out Evaluation Dataset**: 300 payment events (`isEvaluation = true`)

All data is generated deterministically using seed `42` (`npx tsx prisma/seed.ts`).

---

## 2. Benchmark Results (Seed 42)

| Metric | Baseline (No Intervention) | RecoverAI Recovery Agent | Net Lift / Improvement |
| :--- | :--- | :--- | :--- |
| **Evaluation Set Size** | 300 payment cases | 300 payment cases | — |
| **Total Revenue at Risk** | ₹61,91,571 | ₹61,91,571 | — |
| **Recovered Revenue (₹)** | ₹7,86,151 | **₹16,01,882** | **+₹8,15,731** |
| **Recovery Value Rate (%)** | 12.7% | **25.9%** | **+13.2% absolute** |
| **Recovery Count Rate (%)** | 12.0% | **21.7%** | **+9.7% absolute** |
| **Recovery Value Lift (%)** | Baseline | **+103.8% Lift** | **2.04x Money Recovered** |

---

## 3. Action Effectiveness & Guardrail Metrics

- **Average AI Confidence**: 82.4%
- **Human Escalation Rate**: 12.0% (Cases requiring human review)
- **Stopping Rule Rate**: 8.0% (Cases halted by retries limit or unrecoverable reason)
- **False Intervention Rate**: 4.0%
- **Average Interventions per Case**: 1.4 attempts

---

## 4. How to Reproduce Benchmark Results

Run the CLI evaluation script from the project root directory:

```bash
npm run evaluate -- --seed=42
```

Expected output:
```text
=======================================================
       RecoverAI — Evaluation & Benchmark CLI
=======================================================

  Seed:                             42
  Evaluation Set Size:              300 cases
  Total Revenue at Risk:            ₹61,91,571
  RecoverAI Recovered Revenue:      ₹16,01,882
  RecoverAI Recovery Rate (Count):   21.7%
  RecoverAI Recovery Rate (Value):   25.9%
-------------------------------------------------------
  Baseline (No Intervention):       ₹7,86,151
  Net Additional Revenue Recovered:  ₹8,15,731
  Recovery Value Lift over Baseline: +103.8%
=======================================================

  [NOTICE]: Evaluation performed on synthetic held-out test set.
```

---

## 5. Transparency Notice

All metrics represent simulated evaluation outcomes on controlled synthetic datasets. RecoverAI makes no claims of live production deployment or unverified live Razorpay money recovery.
