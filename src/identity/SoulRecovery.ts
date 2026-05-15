import { Buffer } from 'buffer';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes } from '@noble/hashes/utils.js';

export interface SoulRecoveryMessage {
  oldPasskey: Uint8Array;
  newPasskey: Uint8Array;
}

/**
 * Computes the exact message hash used on-chain by `zolvency-soul::recover_soul`:
 * `sha256(old_passkey || new_passkey)`.
 */
export function computeSoulRecoveryMessageHash({ oldPasskey, newPasskey }: SoulRecoveryMessage): Uint8Array {
  return sha256(concatBytes(oldPasskey, newPasskey));
}

/**
 * Derives the uncompressed SEC1 public key (65 bytes, 0x04 + X + Y) from the 32-byte recovery seed.
 *
 * Note: In the SDK we treat the "seed" as the raw P-256 private key scalar (32 bytes).
 */
export function deriveRecoveryPublicKey(recoverySeed: Uint8Array): Uint8Array {
  return p256.getPublicKey(recoverySeed, false);
}

/**
 * Signs the soul recovery message hash with the recovery seed.
 *
 * Output is Soroban-compatible `BytesN<64>`: compact signature `r || s` (32 + 32), normalized to low-S.
 */
export function signSoulRecovery(
  recoverySeed: Uint8Array,
  { oldPasskey, newPasskey }: SoulRecoveryMessage
): Buffer {
  const msgHash = computeSoulRecoveryMessageHash({ oldPasskey, newPasskey });

  // Soroban `secp256r1_verify` verifies against the 32-byte hash directly (no extra hashing).
  // Therefore, we must disable noble's default prehashing here.
  const sig = p256.sign(msgHash, recoverySeed, {
    prehash: false,
    lowS: true,
    format: 'compact',
  });

  return Buffer.from(sig);
}

export function verifySoulRecoverySignature(
  recoveryPubkey: Uint8Array,
  { oldPasskey, newPasskey }: SoulRecoveryMessage,
  signature: Uint8Array
): boolean {
  const msgHash = computeSoulRecoveryMessageHash({ oldPasskey, newPasskey });
  return p256.verify(signature, msgHash, recoveryPubkey, {
    prehash: false,
    lowS: true,
    format: 'compact',
  });
}
