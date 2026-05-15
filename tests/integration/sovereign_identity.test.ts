import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZolvencySDK } from "../../src/index";
import { PasskeyManager } from "../../src/identity/PasskeyManager";
import { TransactionBroadcaster } from "../../src/tx/Broadcaster";
import * as Soul from "../../src/contracts/soul";
import * as Registry from "../../src/contracts/registry";

vi.mock("../../src/tx/Broadcaster", () => {
  return {
    TransactionBroadcaster: vi.fn().mockImplementation(() => ({
      broadcast: vi.fn().mockResolvedValue({ status: "SUCCESS", hash: "TX_HASH" }),
    })),
  };
});

// Mock the contract modules entirely to avoid XDR parsing of real contract specs
vi.mock("../../src/contracts/soul", () => {
  const mockClient = {
    mint: vi.fn(),
    get_soul_id_by_passkey: vi.fn(),
    get_soul: vi.fn(),
    recover_soul: vi.fn(),
  };
  return {
    Client: vi.fn().mockImplementation(() => mockClient),
  };
});

vi.mock("../../src/contracts/registry", () => {
  const mockClient = {
    get_user_reputation: vi.fn(),
    get_soul_reputation: vi.fn(),
    get_signer: vi.fn(),
  };
  return {
    Client: vi.fn().mockImplementation(() => mockClient),
  };
});

vi.mock("../../src/identity/Encryption", () => {
  return {
    encryptKey: vi.fn().mockResolvedValue({
      version: "1",
      salt: "salt",
      iv: "iv",
      ciphertext: "cipher"
    }),
    decryptKey: vi.fn().mockResolvedValue(new Uint8Array(32).fill(7)),
  };
});

describe("Sovereign Identity Integration", () => {
  let sdk: ZolvencySDK;

  beforeEach(() => {
    vi.clearAllMocks();
    sdk = new ZolvencySDK();
  });

  it("should complete full onboarding lifecycle (createIdentity)", async () => {
    // 1. Spy on Passkey Registration
    const createSpy = vi.spyOn(PasskeyManager.prototype, "createIdentity").mockResolvedValue({
      contractId: "G_WALLET_ADDRESS",
      publicKeyHex: "04" + "a".repeat(128), // Dummy 65 bytes hex
      keyIdBase64: "key_id",
      signedTxXdr: "xdr"
    });

    // 2. Setup Soul Mint Mock result
    const mockSoulClient = (Soul.Client as any).mock.results[0].value;
    mockSoulClient.mint.mockResolvedValue({
      result: { isOk: () => true, unwrap: () => "tx_hash" },
      built: { 
        toXDR: () => "dummy_xdr",
        hash: () => Buffer.from("dummy_hash") 
      } // Add this to satisfy the SDK's broadcast check
    });

    const password = "secure-password-123";
    const session = await sdk.createIdentity(password);

    expect(createSpy).toHaveBeenCalled();
    expect(mockSoulClient.mint).toHaveBeenCalled();
    expect(session.address).toBe("G_WALLET_ADDRESS");
    expect(session.encryptedVault).toBeDefined();
    expect(session.encryptedVault.ciphertext).toBeDefined();
    expect(session.recoveryPublicKey).toBeDefined();
  });

  it("should complete resolution lifecycle (identify)", async () => {
    // 1. Spy on Biometric Authentication
    const connectSpy = vi.spyOn(PasskeyManager.prototype, "connectWallet").mockResolvedValue({
      contractId: "G_WALLET_ADDRESS",
      publicKeyHex: "04" + "b".repeat(128),
      keyIdBase64: "key_id"
    });

    // 2. Setup mocks
    const mockSoulClient = (Soul.Client as any).mock.results[0].value;
    mockSoulClient.get_soul_id_by_passkey.mockResolvedValue({
      result: BigInt(123)
    });

    // Registry.Client is instantiated in SDK constructor AND in identify()
    // Since we return the same mock object, results[0].value is enough
    const mockRegistryClient = (Registry.Client as any).mock.results[0].value;
    mockRegistryClient.get_user_reputation.mockResolvedValue({
      result: { github: "token_abc" }
    });
    mockRegistryClient.get_soul_reputation.mockResolvedValue({
      result: { github: "token_abc" }
    });

    const identity = await sdk.identify();

    expect(connectSpy).toHaveBeenCalled();
    expect(mockSoulClient.get_soul_id_by_passkey).toHaveBeenCalled();
    expect(identity.soulId).toBe("123");
    expect(identity.address).toBe("G_WALLET_ADDRESS");
    expect(identity.reputation).toEqual({ github: "token_abc" });
  });

  it("should complete recovery flow (recoverSoul)", async () => {
    // 1. Setup mock data
    const soulId = 123;
    const oldPasskey = Buffer.alloc(65, 1);
    const encryptedVault = {
      version: "1",
      ciphertext: "abc",
      salt: "salt",
      iv: "iv",
      iterations: 1000
    };
    const password = "password123";
    const relayer = "G_RELAYER";

    const mockSoulClient = (Soul.Client as any).mock.results[0].value;
    
    // Mock get_soul to return the old passkey
    mockSoulClient.get_soul.mockResolvedValue({
      result: { passkey: oldPasskey }
    });

    // Mock recover_soul contract call
    mockSoulClient.recover_soul.mockResolvedValue({
      result: { isOk: () => true, unwrap: () => "recovery_tx_hash" }
    });

    // Mock PasskeyManager.createIdentity for the new passkey
    const createSpy = vi.spyOn(PasskeyManager.prototype, "createIdentity").mockResolvedValue({
      contractId: "NEW_WALLET",
      publicKeyHex: "04" + "c".repeat(128),
      keyIdBase64: "new_key_id",
      signedTxXdr: "new_xdr"
    });

    // 2. Execute recovery
    const result = await sdk.recoverSoul({
      password,
      encryptedVault: encryptedVault as any,
      soulId,
      relayer
    });

    // 3. Verify
    expect(mockSoulClient.get_soul).toHaveBeenCalledWith({ id: soulId });
    expect(createSpy).toHaveBeenCalled();
    expect(mockSoulClient.recover_soul).toHaveBeenCalled();
    expect(result.newPasskeyHex).toBe("04" + "c".repeat(128));
  });
});
