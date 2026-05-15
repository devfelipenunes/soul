import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoulSDK } from "../../src/index";
import { SovereignVault } from "../../src/identity/SovereignVault";
import { Buffer } from "buffer";

describe("SoulSDK.quickOnboardAgent", () => {
  let sdk: SoulSDK;

  const mockProfile = {
    fullName: "Test Agent",
    taxId: "123.456.789-00",
    preferredCurrency: "BRL"
  };

  const mockInstructions = {
    transactionId: "pix-123",
    qrCode: "pix-qr-code",
    expiresAt: "2026-05-05T00:00:00Z"
  };

  beforeEach(() => {
    sdk = new SoulSDK({
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
      hubAddress: "CAD2TSMSC7FV6Z6E7NOKLU4UMXR4AHMPDKXNPADDCTAXNXFMAWVOTC4W"
    });

    // Mock SDK internal services/methods
    vi.spyOn(sdk, 'identify').mockResolvedValue({
      soulId: "123",
      address: "GUSER123",
      publicKeyHex: "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
    });

    vi.spyOn(sdk, 'createIdentity').mockResolvedValue({
      soulId: "456",
      address: "GNEWUSER456",
      publicKeyHex: "201f1e1d1c1b1a191817161514131211100f0e0d0c0b0a090807060504030201",
      encryptedVault: {} as any
    });

    vi.spyOn(sdk.funding, 'requestPixDeposit').mockResolvedValue(mockInstructions as any);
    vi.spyOn(sdk.funding, 'pollDepositStatus').mockResolvedValue(true);
    vi.spyOn(sdk.funding, 'ensureTrustline').mockResolvedValue(undefined as any);
    vi.spyOn(sdk.mandate, 'issueMandate').mockResolvedValue("tx-hash-789");
    
    // Mock SovereignVault.encryptProfile
    vi.spyOn(SovereignVault, 'encryptProfile').mockResolvedValue({
      version: "1",
      ciphertext: "encrypted",
      iv: "iv",
      salt: "salt"
    });
  });

  it("should complete onboarding successfully when identity already exists", async () => {
    const onPixReady = vi.fn();
    
    const result = await sdk.quickOnboardAgent({
      agentAddress: "GAGENT789",
      initialBudget: 100,
      profile: mockProfile as any,
      password: "password123",
      onPixReady
    });

    // Verify order and arguments
    expect(sdk.identify).toHaveBeenCalled();
    expect(sdk.createIdentity).not.toHaveBeenCalled();
    
    expect(SovereignVault.encryptProfile).toHaveBeenCalledWith(
      mockProfile,
      Buffer.from("0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20", 'hex')
    );

    expect(sdk.funding.requestPixDeposit).toHaveBeenCalledWith(100, mockProfile);
    expect(onPixReady).toHaveBeenCalledWith(mockInstructions);
    expect(sdk.funding.pollDepositStatus).toHaveBeenCalledWith("pix-123");
    expect(sdk.funding.ensureTrustline).toHaveBeenCalledWith("GUSER123");
    expect(sdk.mandate.issueMandate).toHaveBeenCalledWith("GUSER123", "GAGENT789", 100, 30);

    expect(result).toEqual({
      soulId: "123",
      mandateId: "1",
      txHash: "tx-hash-789"
    });
  });

  it("should complete onboarding successfully when identity does not exist", async () => {
    // Make identify fail
    vi.spyOn(sdk, 'identify').mockRejectedValue(new Error("No identity"));

    const result = await sdk.quickOnboardAgent({
      agentAddress: "GAGENT789",
      initialBudget: 100,
      profile: mockProfile as any,
      password: "password123"
    });

    expect(sdk.identify).toHaveBeenCalled();
    expect(sdk.createIdentity).toHaveBeenCalledWith("password123");
    
    expect(sdk.funding.ensureTrustline).toHaveBeenCalledWith("GNEWUSER456");
    expect(sdk.mandate.issueMandate).toHaveBeenCalledWith("GNEWUSER456", "GAGENT789", 100, 30);

    expect(result.soulId).toBe("456");
  });

  it("should throw error if funding fails", async () => {
    vi.spyOn(sdk.funding, 'pollDepositStatus').mockResolvedValue(false);

    await expect(sdk.quickOnboardAgent({
      agentAddress: "GAGENT789",
      initialBudget: 100,
      profile: mockProfile as any,
      password: "password123"
    })).rejects.toThrow("Funding failed or timed out.");
  });
});
