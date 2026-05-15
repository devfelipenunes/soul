import { Buffer } from "buffer";
import { encryptKey } from "./Encryption";
import type { EncryptedVault } from "./Encryption";
import { PasskeyManager } from "./PasskeyManager";
import { logger } from "../utils/Logger";

export interface IdentityMetadata {
  soulId: string;
  address: string;
  reputation: Record<string, any>;
  metadata?: any;
  publicKeyHex?: string;
}

export interface SovereignSession {
  soulId: string;
  address: string;
  encryptedVault: EncryptedVault;
  recoveryPublicKey: string;
  txHash?: string;
  publicKeyHex?: string;
}

/**
 * Normalizes a public key to 65 bytes (0x04 prefix + X + Y).
 */
export function normalizePublicKey(pubKey: Uint8Array): Uint8Array {
  if (pubKey.length > 65) {
    return pubKey.slice(pubKey.length - 65);
  }
  if (pubKey.length === 64) {
    const fixedKey = new Uint8Array(65);
    fixedKey[0] = 0x04;
    fixedKey.set(pubKey, 1);
    return fixedKey;
  }
  return pubKey;
}

/**
 * Generates a recovery key pair and returns the seed and normalized public key.
 */
export async function generateRecoveryKey(): Promise<{ seed: Buffer; publicKey: Buffer }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const jwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const rawPubKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);

  // We use the 'd' parameter (private key) as the "seed"
  // JWK 'd' is base64url encoded
  const seed = Buffer.from(jwk.d!, 'base64');
  const publicKey = Buffer.from(normalizePublicKey(new Uint8Array(rawPubKey)));

  return { seed, publicKey };
}
