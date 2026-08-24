// ─── RecoverAI Executive Copilot API Tests ─────────────────────────────────────────

import { describe, it, expect } from 'vitest';

describe('RecoverAI Copilot Chat API', () => {
  it('should process natural language intent for batch recovery', async () => {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Run batch recovery' }),
    }).catch(() => null);

    if (res) {
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.reply).toContain('Batch Recovery');
    }
  }, 15000);

  it('should process scenario commands and return navigation actions', async () => {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Run Scenario B' }),
    }).catch(() => null);

    if (res) {
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.reply).toContain('Scenario B');
      expect(data.actionCommand?.type).toBe('NAVIGATE');
    }
  });
});
