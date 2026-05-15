import { describe, it, expect } from "vitest";
import { encryptKey, decryptKey } from "../../src/identity/Encryption";

describe("Encryption Module", () => {
  const password = "secure-password-123";
  const rawKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

  it("should encrypt and decrypt a key correctly", async () => {
    const vault = await encryptKey(rawKey, password);
    
    expect(vault.version).toBe("1");
    expect(vault.salt).toBeDefined();
    expect(vault.iv).toBeDefined();
    expect(vault.ciphertext).toBeDefined();

    const decrypted = await decryptKey(vault, password);
    expect(Buffer.from(decrypted)).toEqual(Buffer.from(rawKey));
  });

  it("should throw an error if the password is incorrect during decryption", async () => {
    const vault = await encryptKey(rawKey, password);
    
    await expect(decryptKey(vault, "wrong-password"))
      .rejects.toThrow();
  });

  it("should generate different salt and IV for each encryption", async () => {
    const vault1 = await encryptKey(rawKey, password);
    const vault2 = await encryptKey(rawKey, password);

    expect(vault1.salt).not.toBe(vault2.salt);
    expect(vault1.iv).not.toBe(vault2.iv);
    expect(vault1.ciphertext).not.toBe(vault2.ciphertext);
  });

  it("should handle Buffer input for encryptKey", async () => {
    const bufferKey = Buffer.from(rawKey);
    const vault = await encryptKey(bufferKey, password);
    const decrypted = await decryptKey(vault, password);
    
    expect(Buffer.from(decrypted)).toEqual(bufferKey);
  });

  it("should handle 32-byte keys (Seeds)", async () => {
    const seed = crypto.getRandomValues(new Uint8Array(32));
    const vault = await encryptKey(seed, password);
    const decrypted = await decryptKey(vault, password);
    
    expect(Buffer.from(decrypted)).toEqual(Buffer.from(seed));
  });
});
