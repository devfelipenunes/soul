# Sovereign Identity SDK Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the new Sovereign Identity methods in the main `ZolvencySDK` class and verify everything with an integration test.

**Architecture:** Wrap `IdentityService` methods in `ZolvencySDK` for high-level consumption. Use existing mocking patterns for integration testing to avoid network and hardware dependency.

**Tech Stack:** TypeScript, Vitest, Stellar SDK.

---

### Task 1: Update Exports and Constants

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Export Sovereign Identity Types**
Add exports for `EncryptedVault`, `SovereignSession`, and `IdentityMetadata` at the end of the file.

- [ ] **Step 2: Update PRESETS.TESTNET**
Ensure `soulContractId` and `registryContractId` (hubAddress) are set to the correct values for Sovereign testing if they differ, or keep current if they are ready.

```typescript
// src/index.ts

// ... existing exports
export { EncryptedVault } from "./identity/Encryption";
export { SovereignSession, IdentityMetadata } from "./identity/SovereignIdentity";
```

### Task 2: Expose Sovereign Methods in ZolvencySDK

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add `createIdentity` and `identify` methods**

```typescript
// src/index.ts -> inside ZolvencySDK class

  /**
   * Starts the Sovereign Identity onboarding process.
   * Biometric handshake -> Recovery Key generation -> Encrypted Vault creation -> Soul Mint.
   */
  async createIdentity(password: string): Promise<SovereignSession> {
    return this.identity.createSovereignIdentity(password);
  }

  /**
   * Performs automated Sovereign Identity resolution.
   * Biometric handshake -> Soul ID resolution -> Reputation data loading.
   */
  async identify(): Promise<IdentityMetadata> {
    return this.identity.identify();
  }
```

### Task 3: Create Integration Test

**Files:**
- Create: `tests/integration/sovereign_identity.test.ts`

- [ ] **Step 1: Write integration test with mocks**
Simulate the full lifecycle using mocked dependencies.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZolvencySDK } from "../../src/index";

// Mock the contracts and passkey manager
vi.mock("../../src/identity/PasskeyManager");
vi.mock("../../src/contracts/soul");
vi.mock("../../src/contracts/registry");

describe("Sovereign Identity Integration", () => {
  let sdk: ZolvencySDK;

  beforeEach(() => {
    vi.clearAllMocks();
    sdk = new ZolvencySDK();
  });

  it("should complete full onboarding lifecycle (createIdentity)", async () => {
    const { PasskeyManager } = await import("../../src/identity/PasskeyManager");
    const Soul = await import("../../src/contracts/soul");

    // 1. Mock Passkey Registration
    (PasskeyManager.prototype.createIdentity as any) = vi.fn().mockResolvedValue({
      contractId: "G_WALLET_ADDRESS",
      publicKeyHex: "04" + "a".repeat(128), // Dummy 65 bytes hex
    });

    // 2. Mock Soul Mint Call
    (Soul.Client.prototype.mint as any) = vi.fn().mockResolvedValue({
      result: { isOk: () => true, unwrap: () => "tx_hash" }
    });

    const password = "secure-password-123";
    const session = await sdk.createIdentity(password);

    expect(session.address).toBe("G_WALLET_ADDRESS");
    expect(session.encryptedVault).toBeDefined();
    expect(session.encryptedVault.ciphertext).toBeDefined();
    expect(session.recoveryPublicKey).toBeDefined();
  });

  it("should complete resolution lifecycle (identify)", async () => {
    const { PasskeyManager } = await import("../../src/identity/PasskeyManager");
    const Soul = await import("../../src/contracts/soul");
    const Registry = await import("../../src/contracts/registry");

    // 1. Mock Biometric Authentication
    (PasskeyManager.prototype.connectWallet as any) = vi.fn().mockResolvedValue({
      contractId: "G_WALLET_ADDRESS",
      publicKeyHex: "04" + "b".repeat(128),
    });

    // 2. Mock Soul ID Resolution
    (Soul.Client.prototype.get_soul_id_by_passkey as any) = vi.fn().mockResolvedValue({
      result: BigInt(123)
    });

    // 3. Mock Reputation Data
    (Registry.Client.prototype.get_user_reputation as any) = vi.fn().mockResolvedValue({
      result: { github: "token_abc" }
    });

    const identity = await sdk.identify();

    expect(identity.soulId).toBe("123");
    expect(identity.address).toBe("G_WALLET_ADDRESS");
    expect(identity.reputation).toEqual({ github: "token_abc" });
    expect(sdk.getAddress()).toBe("G_WALLET_ADDRESS");
  });
});
```

### Task 4: Final Validation

- [ ] **Step 1: Run all tests**
Run: `npm test tests/integration/sovereign_identity.test.ts`
Expected: All tests pass.

- [ ] **Step 2: Run build**
Run: `npm run build`
Expected: Build successful, types generated correctly.
