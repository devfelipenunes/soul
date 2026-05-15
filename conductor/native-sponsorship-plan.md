# Full On-Chain Native Sponsorship (CAP-33) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 100% free experience for users by using Stellar's native Account Sponsorship (CAP-33) and refactoring the SDK to a "Broadcast-First" model that doesn't require a custom paymaster URL.

**Architecture:** We are leveraging Stellar's protocol-level sponsorship. The `zolvency-soul` contract will be updated to allow an admin account to sponsor the ledger entries (Soul Tokens). The SDK will be refactored to remove the `paymasterUrl` requirement and instead output "Sponsorship-Ready" transactions. This eliminates all costs for the end-user (both gas and storage reserves).

**Tech Stack:** Rust (Soroban SDK), TypeScript (Stellar SDK), Vitest.

---

### Task 1: Add Sponsorship Support to Soul Contract

**Context:** Stellar's CAP-33 allows an account to "sponsor" the reserve requirements of ledger entries created by another account.

**Files:**
- Modify: `../contracts/packages/stellar/contracts/zolvency-soul/src/lib.rs`

- [ ] **Step 1: Implement `sponsor_entry` logic**
In Soroban, when a contract creates a persistent entry, the reserve is paid by the transaction submitter. To use CAP-33, we need to ensure the contract handles the storage in a way that the network identifies the admin as the sponsor.

Update the `mint` function to allow a sponsor-supported flow.
(Note: Native sponsorship in Soroban works by the submitter providing the sponsorship envelope. The contract just needs to be compatible with creating entries that can be sponsored).

```rust
    pub fn mint(
        env: Env,
        relayer: Address, // This will be the Admin/Sponsor wallet
        user: Address,
        passkey: BytesN<32>,
    ) -> Result<(), Error> {
        extend_instance(&env);
        // ... (existing logic) ...
        // No changes needed to the Rust code for CAP-33 sponsorship itself, 
        // as sponsorship is handled at the transaction envelope level in Stellar.
        // However, we will restore the clean state from the previous task.
        Ok(())
    }
```

- [ ] **Step 2: Clean up any remaining "Refund" code**
Ensure all XLM refund code is gone, as sponsorship is a protocol feature, not a manual transfer.

### Task 2: Refactor SDK to "Broadcast-First" (Zero-Config)

**Context:** Users shouldn't need to provide a `paymasterUrl`. The SDK should default to a "Decentralized Broadcast" mode.

**Files:**
- Modify: `src/services/IdentityService.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Remove `paymasterUrl` requirement**
Make `paymasterUrl` optional in `IdentityConfig`. Default it to `undefined`.

- [ ] **Step 2: Update `connect` to return XDR immediately**
The `connect` method should focus on generating the user's signed intent.

```typescript
  async connect(username: string, forceMobile = false): Promise<ZolvencySession> {
    try {
      logger.info(`Starting Free On-Chain Onboarding for: ${username}`);
      const identity = await this.passkeyManager.createIdentity(
          this.config.appName, 
          username, 
          forceMobile
      );

      // We no longer try to fetch a paymaster automatically unless explicitly told.
      // This allows the dApp to handle the "Public Fee-Bump" or "Sponsorship" logic.
      return {
        address: identity.contractId,
        keyId: identity.keyIdBase64,
        soulId: undefined,
        username,
        txHash: "READY_FOR_SPONSORSHIP",
        signedTxXdr: identity.signedTxXdr
      };
    } catch (error: any) {
      logger.error("Onboarding failed", error);
      throw new Error(`[Zolvency Identity] ${error.message}`);
    }
  }
```

### Task 3: Update Main Config and Presets

**Context:** The SDK presets should point to public RPCs, not private relayers.

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update PRESETS**
Remove any specific `paymasterUrl` from `PRESETS.TESTNET`. Use only public Stellar RPCs.

### Task 4: Documentation for "Free Onboarding"

**Context:** Explain to developers how they can sponsor their own users using this SDK.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Explain Sponsorship Flow**
Update `README.md` to show that the SDK generates a transaction that is "Sponsor-Ready". Provide an example of how to use a generic Stellar Fee-Bump to make it free for the user.
