import { describe, it, expect } from 'vitest';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import {
  computeSoulRecoveryMessageHash,
  deriveRecoveryPublicKey,
  signSoulRecovery,
  verifySoulRecoverySignature,
} from '../../src/identity/SoulRecovery';

describe('SoulRecovery helpers', () => {
  it('signs a Soroban-compatible compact signature (64 bytes) and verifies', () => {
    const recoverySeed = sha256(utf8ToBytes('zolvency-recovery-seed'));

    const oldPasskey = new Uint8Array(65).fill(0);
    oldPasskey[0] = 0x04;
    const newPasskey = new Uint8Array(65).fill(1);
    newPasskey[0] = 0x04;

    const pub = deriveRecoveryPublicKey(recoverySeed);
    expect(pub.length).toBe(65);
    expect(pub[0]).toBe(0x04);

    const sig = signSoulRecovery(recoverySeed, { oldPasskey, newPasskey });
    expect(sig.length).toBe(64);

    const ok = verifySoulRecoverySignature(pub, { oldPasskey, newPasskey }, sig);
    expect(ok).toBe(true);
  });

  it('computes hash as sha256(old||new)', () => {
    const oldPasskey = new Uint8Array([1, 2, 3]);
    const newPasskey = new Uint8Array([4, 5]);

    const expected = sha256(new Uint8Array([1, 2, 3, 4, 5]));
    const got = computeSoulRecoveryMessageHash({ oldPasskey, newPasskey });

    expect(Buffer.from(got).toString('hex')).toBe(Buffer.from(expected).toString('hex'));
  });
});
