import { describe, it, expect } from 'vitest';

const RELAYER_BASE_URL = 'http://localhost:3000/api/passkey';

async function isRelayerRunning() {
  try {
    const res = await fetch(`${RELAYER_BASE_URL}/check-soul?address=G...`, { signal: AbortSignal.timeout(1000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

const running = await isRelayerRunning();

describe.skipIf(!running)('Relayer Integration Tests (requires local relayer)', () => {
  it('should handle a malformed XDR with a 500 error and helpful message', async () => {
    const res = await fetch(`${RELAYER_BASE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txXdr: 'AAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' }),
    });
    
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('should handle mint request missing fields', async () => {
    const res = await fetch(`${RELAYER_BASE_URL}/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test' }), // missing walletContractId
    });
    
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('walletContractId');
  });
});
