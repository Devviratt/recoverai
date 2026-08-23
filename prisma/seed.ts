// ─── RecoverAI Synthetic Dataset Seed Script ────────────────────────────────────
// Generates 1,000 synthetic payment events with realistic Indian merchant scenarios.
// Deterministic with configurable seed (default: 42).
//
// Usage:
//   npx tsx prisma/seed.ts
//   npx tsx prisma/seed.ts --seed 42

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Seeded Random Number Generator ────────────────────────────────────────────
// Simple but deterministic PRNG (mulberry32)

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
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
    weightedPick<T>(items: { value: T; weight: number }[]): T {
      const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
      let r = this.next() * totalWeight;
      for (const item of items) {
        r -= item.weight;
        if (r <= 0) return item.value;
      }
      return items[items.length - 1].value;
    },
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const FAILURE_REASONS = [
  { value: 'insufficient_funds', weight: 25 },
  { value: 'card_declined', weight: 15 },
  { value: 'bank_timeout', weight: 12 },
  { value: 'authentication_failed', weight: 10 },
  { value: 'network_error', weight: 8 },
  { value: 'daily_limit_exceeded', weight: 6 },
  { value: 'card_expired', weight: 6 },
  { value: 'invalid_card', weight: 5 },
  { value: 'technical_error', weight: 5 },
  { value: 'international_card_blocked', weight: 4 },
  { value: 'suspected_fraud', weight: 2 },
  { value: 'account_closed', weight: 2 },
];

const PAYMENT_METHODS = [
  { value: 'card', weight: 40 },
  { value: 'upi', weight: 35 },
  { value: 'netbanking', weight: 15 },
  { value: 'wallet', weight: 10 },
];

const CUSTOMER_SEGMENTS = [
  { value: 'regular', weight: 60 },
  { value: 'premium', weight: 30 },
  { value: 'enterprise', weight: 10 },
];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Arjun', 'Diya', 'Ishaan', 'Kavya', 'Krishna', 'Meera',
  'Neha', 'Om', 'Priya', 'Rahul', 'Riya', 'Rohan', 'Sanya', 'Tanvi',
  'Varun', 'Vihaan', 'Yash', 'Zara', 'Aditya', 'Ananya', 'Aryan', 'Bhavya',
  'Chetan', 'Deepa', 'Esha', 'Gaurav', 'Harsh', 'Isha',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Nair',
  'Joshi', 'Mehta', 'Verma', 'Shah', 'Rao', 'Chopra', 'Bansal', 'Agarwal',
  'Malhotra', 'Bhat', 'Das', 'Sinha',
];

// Amount ranges that represent realistic Indian e-commerce/SaaS payments
const AMOUNT_RANGES = [
  { value: { min: 99, max: 499 }, weight: 15 },      // Small purchases
  { value: { min: 500, max: 1999 }, weight: 25 },     // Medium purchases
  { value: { min: 2000, max: 4999 }, weight: 20 },    // Standard purchases
  { value: { min: 5000, max: 14999 }, weight: 15 },   // Premium purchases
  { value: { min: 15000, max: 49999 }, weight: 15 },  // High-value
  { value: { min: 50000, max: 150000 }, weight: 10 }, // Enterprise/luxury
];

// ─── Main Seed Function ────────────────────────────────────────────────────────

async function seed(seedValue: number = 42) {
  console.log(`\n🌱 RecoverAI — Seeding database with seed: ${seedValue}\n`);

  const rng = createRNG(seedValue);

  // Clean existing data
  console.log('  Cleaning existing data...');
  await prisma.auditEvent.deleteMany();
  await prisma.policyDecision.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.recoveryAction.deleteMany();
  await prisma.recoveryCase.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();

  // Create merchant
  console.log('  Creating merchant...');
  const merchant = await prisma.merchant.create({
    data: {
      name: 'RecoverAI Demo Merchant',
      email: 'merchant@recoverai.demo',
      businessType: 'e-commerce',
    },
  });

  // Create customers (200 unique customers)
  console.log('  Creating 200 customers...');
  const customerCount = 200;
  const customers = [];

  for (let i = 0; i < customerCount; i++) {
    const firstName = rng.pick(FIRST_NAMES);
    const lastName = rng.pick(LAST_NAMES);
    const segment = rng.weightedPick(CUSTOMER_SEGMENTS);
    const totalTx = rng.int(1, 50);
    const successRate = Math.min(1, Math.max(0, 0.3 + rng.next() * 0.65)); // 0.3 to 0.95
    const successful = Math.round(totalTx * successRate);
    const failed = totalTx - successful;

    const customer = await prisma.customer.create({
      data: {
        merchantId: merchant.id,
        externalId: `CUST_${(10000 + i).toString()}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: `+91${rng.int(7000000000, 9999999999)}`,
        segment,
        totalTransactions: totalTx,
        successfulPayments: successful,
        failedPayments: failed,
        successRate,
        lifetimeValue: successful * rng.int(500, 10000),
      },
    });
    customers.push(customer);
  }

  // Create 1,000 failed payment events
  console.log('  Creating 1,000 failed payments...');
  const paymentCount = 1000;
  const payments = [];
  const now = new Date();

  for (let i = 0; i < paymentCount; i++) {
    const customer = rng.pick(customers);
    const failureReason = rng.weightedPick(FAILURE_REASONS);
    const paymentMethod = rng.weightedPick(PAYMENT_METHODS);
    const amountRange = rng.weightedPick(AMOUNT_RANGES);
    const amount = rng.int(amountRange.min, amountRange.max);

    // Distribute failures over the last 7 days
    const hoursAgo = rng.int(1, 168); // 1 hour to 7 days
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const payment = await prisma.payment.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        externalId: `pay_demo_${(100000 + i).toString(36)}`,
        orderId: `order_demo_${(200000 + i).toString(36)}`,
        amount,
        currency: 'INR',
        status: 'failed',
        failureReason,
        paymentMethod,
        international: rng.next() < 0.05,
        attemptCount: 1,
        createdAt,
        updatedAt: createdAt,
      },
    });
    payments.push({ payment, hoursAgo });
  }

  // Create recovery cases for all failed payments
  // Split: 700 training/development, 300 held-out evaluation
  console.log('  Creating 1,000 recovery cases (700 dev + 300 eval)...');

  const shuffledPayments = [...payments].sort(() => rng.next() - 0.5);
  
  for (let i = 0; i < shuffledPayments.length; i++) {
    const { payment } = shuffledPayments[i];
    const isEval = i >= 700; // Last 300 are evaluation set

    await prisma.recoveryCase.create({
      data: {
        paymentId: payment.id,
        customerId: payment.customerId,
        status: 'AT_RISK',
        revenueAtRisk: payment.amount,
        isEvaluation: isEval,
      },
    });
  }

  // ─── Create Hero Demo Scenarios ─────────────────────────────────────────────

  console.log('  Creating hero demo scenarios...');

  // Scenario A: Repeat customer, ₹2,499, insufficient_funds, 8 successful payments
  const heroCustomerA = await prisma.customer.create({
    data: {
      merchantId: merchant.id,
      externalId: 'CUST_HERO_A',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+919876543210',
      segment: 'premium',
      totalTransactions: 9,
      successfulPayments: 8,
      failedPayments: 1,
      successRate: 0.89,
      lifetimeValue: 42500,
    },
  });

  const heroPaymentA = await prisma.payment.create({
    data: {
      merchantId: merchant.id,
      customerId: heroCustomerA.id,
      externalId: 'pay_hero_scenario_a',
      orderId: 'order_hero_a',
      amount: 2499,
      currency: 'INR',
      status: 'failed',
      failureReason: 'insufficient_funds',
      paymentMethod: 'card',
      attemptCount: 1,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  });

  await prisma.recoveryCase.create({
    data: {
      paymentId: heroPaymentA.id,
      customerId: heroCustomerA.id,
      status: 'AT_RISK',
      revenueAtRisk: 2499,
      isEvaluation: false,
    },
  });

  // Scenario B: High-value ₹75,000 payment → should trigger policy escalation
  const heroCustomerB = await prisma.customer.create({
    data: {
      merchantId: merchant.id,
      externalId: 'CUST_HERO_B',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@example.com',
      phone: '+919876543211',
      segment: 'enterprise',
      totalTransactions: 15,
      successfulPayments: 12,
      failedPayments: 3,
      successRate: 0.80,
      lifetimeValue: 450000,
    },
  });

  const heroPaymentB = await prisma.payment.create({
    data: {
      merchantId: merchant.id,
      customerId: heroCustomerB.id,
      externalId: 'pay_hero_scenario_b',
      orderId: 'order_hero_b',
      amount: 75000,
      currency: 'INR',
      status: 'failed',
      failureReason: 'bank_timeout',
      paymentMethod: 'netbanking',
      attemptCount: 1,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  await prisma.recoveryCase.create({
    data: {
      paymentId: heroPaymentB.id,
      customerId: heroCustomerB.id,
      status: 'AT_RISK',
      revenueAtRisk: 75000,
      isEvaluation: false,
    },
  });

  // Scenario C: Repeated failure → stopping rules should kick in
  const heroCustomerC = await prisma.customer.create({
    data: {
      merchantId: merchant.id,
      externalId: 'CUST_HERO_C',
      name: 'Amit Kumar',
      email: 'amit.kumar@example.com',
      phone: '+919876543212',
      segment: 'regular',
      totalTransactions: 6,
      successfulPayments: 2,
      failedPayments: 4,
      successRate: 0.33,
      lifetimeValue: 3500,
    },
  });

  const heroPaymentC = await prisma.payment.create({
    data: {
      merchantId: merchant.id,
      customerId: heroCustomerC.id,
      externalId: 'pay_hero_scenario_c',
      orderId: 'order_hero_c',
      amount: 1299,
      currency: 'INR',
      status: 'failed',
      failureReason: 'card_declined',
      paymentMethod: 'card',
      attemptCount: 3,
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 48 hours ago
    },
  });

  await prisma.recoveryCase.create({
    data: {
      paymentId: heroPaymentC.id,
      customerId: heroCustomerC.id,
      status: 'STOPPED',
      stopReason: 'MAX_ATTEMPTS_REACHED',
      stoppedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      revenueAtRisk: 1299,
      recoveryAttempts: 3,
      maxAttempts: 3,
      isEvaluation: false,
    },
  });

  // Scenario D: Strategy Comparison & Expected Value Selection
  const heroCustomerD = await prisma.customer.create({
    data: {
      merchantId: merchant.id,
      externalId: 'CUST_HERO_D',
      name: 'Kavya Verma',
      email: 'kavya.verma@example.com',
      phone: '+919876543213',
      segment: 'premium',
      totalTransactions: 10,
      successfulPayments: 8,
      failedPayments: 2,
      successRate: 0.80,
      lifetimeValue: 38000,
    },
  });

  const heroPaymentD = await prisma.payment.create({
    data: {
      merchantId: merchant.id,
      customerId: heroCustomerD.id,
      externalId: 'pay_hero_scenario_d',
      orderId: 'order_hero_d',
      amount: 4999,
      currency: 'INR',
      status: 'failed',
      failureReason: 'card_declined',
      paymentMethod: 'card',
      attemptCount: 1,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
  });

  await prisma.recoveryCase.create({
    data: {
      paymentId: heroPaymentD.id,
      customerId: heroCustomerD.id,
      status: 'AT_RISK',
      revenueAtRisk: 4999,
      isEvaluation: false,
    },
  });

  // ─── Summary ──────────────────────────────────────────────────────────────────

  const totalPayments = await prisma.payment.count();
  const totalCases = await prisma.recoveryCase.count();
  const evalCases = await prisma.recoveryCase.count({ where: { isEvaluation: true } });
  const totalRevenue = await prisma.payment.aggregate({ _sum: { amount: true } });

  console.log(`\n✅ Seed complete!`);
  console.log(`  Merchant: ${merchant.name}`);
  console.log(`  Customers: ${customerCount + 3} (including 3 hero scenarios)`);
  console.log(`  Failed Payments: ${totalPayments}`);
  console.log(`  Recovery Cases: ${totalCases}`);
  console.log(`  Development Set: ${totalCases - evalCases}`);
  console.log(`  Evaluation Set: ${evalCases}`);
  console.log(`  Total Revenue at Risk: ₹${(totalRevenue._sum.amount || 0).toLocaleString('en-IN')}`);
  console.log(`  Seed: ${seedValue}`);
  console.log('');
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────────

const seedArg = process.argv.find((a) => a.startsWith('--seed='));
const seedValue = seedArg ? parseInt(seedArg.split('=')[1], 10) : 42;

seed(seedValue)
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
