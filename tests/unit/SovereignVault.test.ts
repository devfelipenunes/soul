import { describe, it, expect } from "vitest";
import { SovereignVault } from "../../src/identity/SovereignVault";
import { IdentityProfile } from "../../src/identity/SovereignProfile";
import { Buffer } from "buffer";

describe("SovereignVault", () => {
  const passkeyHash = Buffer.from("super-secret-biometric-hash-12345678");
  const profile: IdentityProfile = {
    fullName: "John Doe",
    taxId: "123.456.789-00",
    email: "john@example.com",
    preferredCurrency: "BRL",
  };

  it("should encrypt and decrypt a profile correctly", async () => {
    const vault = await SovereignVault.encryptProfile(profile, passkeyHash);
    
    expect(vault.version).toBe("1");
    expect(vault.ciphertext).toBeDefined();

    const decryptedProfile = await SovereignVault.decryptProfile(vault, passkeyHash);
    expect(decryptedProfile).toEqual(profile);
  });

  it("should fail to decrypt with an incorrect passkeyHash", async () => {
    const vault = await SovereignVault.encryptProfile(profile, passkeyHash);
    const wrongHash = Buffer.from("wrong-biometric-hash");
    
    await expect(SovereignVault.decryptProfile(vault, wrongHash))
      .rejects.toThrow("Decryption failed. Incorrect key or corrupted data.");
  });

  it("should handle optional fields correctly", async () => {
    const minimalProfile: IdentityProfile = {
      fullName: "Jane Doe",
      taxId: "987.654.321-99",
      preferredCurrency: "USD",
    };

    const vault = await SovereignVault.encryptProfile(minimalProfile, passkeyHash);
    const decryptedProfile = await SovereignVault.decryptProfile(vault, passkeyHash);
    
    expect(decryptedProfile).toEqual(minimalProfile);
    expect(decryptedProfile.email).toBeUndefined();
  });

  it("should produce different ciphertexts for the same profile and key", async () => {
    const vault1 = await SovereignVault.encryptProfile(profile, passkeyHash);
    const vault2 = await SovereignVault.encryptProfile(profile, passkeyHash);
    
    expect(vault1.ciphertext).not.toBe(vault2.ciphertext);
    expect(vault1.iv).not.toBe(vault2.iv);
  });
});
