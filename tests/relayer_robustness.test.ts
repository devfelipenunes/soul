import { describe, it, expect } from 'vitest';

const RELAYER_URL = 'http://127.0.0.1:3000/api/passkey';

async function isRelayerRunning() {
  try {
    const res = await fetch(`${RELAYER_URL}/check-soul?address=G...`, { signal: AbortSignal.timeout(1000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

const running = await isRelayerRunning();

describe.skipIf(!running)('Relayer Robustness Tests (requires local relayer)', () => {
  it('should return 400 if txXdr is missing', async () => {
    const res = await fetch(`${RELAYER_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('txXdr');
  });

  it('should return 500 if txXdr is invalid', async () => {
    const res = await fetch(`${RELAYER_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txXdr: 'invalid-xdr' }),
    });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('should check connectivity to the mint endpoint', async () => {
    const res = await fetch(`${RELAYER_URL}/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
