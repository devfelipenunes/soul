/**
 * Encrypted Vault structure for recovery keys.
 */
export interface EncryptedVault {
  version: string;
  salt: string;
  iv: string;
  ciphertext: string;
}

const ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ALGORITHM_NAME = "AES-GCM";
const KEY_DERIVATION_ALGO = "PBKDF2";

/**
 * Encrypts a key using a password-based key derivation function (PBKDF2)
 * and AES-GCM encryption.
 * 
 * @param key The key to encrypt (Buffer or Uint8Array)
 * @param password The password to use for encryption
 * @returns An EncryptedVault containing the encrypted data and metadata
 */
export async function encryptKey(key: Buffer | Uint8Array, password: string): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derivedKey = await deriveKeyFromPassword(password, salt, ["encrypt"]);
  return encryptData(new Uint8Array(key), derivedKey, salt);
}

/**
 * Decrypts a key from an EncryptedVault using the provided password.
 * 
 * @param vault The EncryptedVault containing the encrypted data
 * @param password The password used for encryption
 * @returns The decrypted key as a Uint8Array
 * @throws Error if decryption fails (e.g., incorrect password)
 */
export async function decryptKey(vault: EncryptedVault, password: string): Promise<Uint8Array> {
  if (vault.version !== "1") {
    throw new Error(`Unsupported vault version: ${vault.version}`);
  }

  const salt = new Uint8Array(Buffer.from(vault.salt, "base64"));
  const derivedKey = await deriveKeyFromPassword(password, salt, ["decrypt"]);
  return decryptData(vault, derivedKey);
}

/**
 * Generic data encryption using AES-GCM.
 */
export async function encryptData(data: Uint8Array, key: CryptoKey, salt?: Uint8Array): Promise<EncryptedVault> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM_NAME,
      iv: iv,
    },
    key,
    toArrayBuffer(data)
  );

  return {
    version: "1",
    salt: salt ? Buffer.from(salt).toString("base64") : "",
    iv: Buffer.from(iv).toString("base64"),
    ciphertext: Buffer.from(ciphertextBuffer).toString("base64"),
  };
}

/**
 * Generic data decryption using AES-GCM.
 */
export async function decryptData(vault: EncryptedVault, key: CryptoKey): Promise<Uint8Array> {
  const iv = new Uint8Array(Buffer.from(vault.iv, "base64"));
  const ciphertext = new Uint8Array(Buffer.from(vault.ciphertext, "base64"));

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM_NAME,
        iv: iv,
      },
      key,
      toArrayBuffer(ciphertext)
    );
    return new Uint8Array(decryptedBuffer);
  } catch (error) {
    throw new Error("Decryption failed. Incorrect key or corrupted data.");
  }
}

/**
 * Internal helper to derive a crypto key from a password using PBKDF2.
 */
export async function deriveKeyFromPassword(
  password: string, 
  salt: Uint8Array, 
  keyUsages: KeyUsage[]
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: KEY_DERIVATION_ALGO },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGO,
      salt: toArrayBuffer(salt),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: ALGORITHM_NAME, length: 256 },
    false,
    keyUsages
  );
}

/**
 * Derives an AES-GCM key from a raw buffer (e.g., a passkey hash).
 */
export async function deriveKeyFromBuffer(
  buffer: Uint8Array | Buffer,
  keyUsages: KeyUsage[]
): Promise<CryptoKey> {
  // We use the buffer directly if it's 256 bits, or hash it if it's not.
  // To keep it consistent, we'll hash it with SHA-256.
  const hashBuffer = await crypto.subtle.digest("SHA-256", toArrayBuffer(new Uint8Array(buffer)));
  
  return await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: ALGORITHM_NAME },
    false,
    keyUsages
  );
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Ensure we pass an ArrayBuffer-backed view to WebCrypto types.
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
