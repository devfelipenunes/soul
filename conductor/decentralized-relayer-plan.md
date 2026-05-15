# Gas Sponsorship via Managed Paymaster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a gas sponsorship model using a Managed Paymaster (like Launchtube) where the project owner's wallet funds the transaction fees without requiring a custom-built relayer server.

**Architecture:** We are moving away from the proprietary Zolvency backend relayer. Instead, the SDK will generate a standard Soroban transaction. The dApp (or SDK) will then submit this transaction to a Managed Paymaster service (which holds the sponsor's wallet). The Paymaster applies a Fee-Bump transaction and submits it to the Stellar network. We must also revert the experimental on-chain refund logic from the smart contract, as it's no longer the chosen approach.

**Tech Stack:** Rust (Soroban SDK), TypeScript (Stellar SDK), Vitest.

---

### Task 1: Revert On-Chain Refund Logic in Contract

**Context:** The previous experimental logic for the contract to refund the fee payer in XLM is no longer needed, as the gas will be sponsored externally via Fee-Bumps.

**Files:**
- Modify: `../contracts/packages/stellar/contracts/zolvency-soul/src/lib.rs`
- Modify: `../contracts/packages/stellar/contracts/zolvency-soul/Cargo.toml`

- [ ] **Step 1: Remove `token` feature from Cargo.toml**
Remove `soroban_sdk::token` dependency feature if it was added for the refund logic.

- [ ] **Step 2: Clean up `lib.rs` DataKeys and State**
Remove `FeeToken` and `RefundAmount` from the `DataKey` enum. Remove them from the `initialize` function signature and storage.

- [ ] **Step 3: Revert `mint` and remove `deposit_gas_funds`**
Remove the `fee_payer` argument and refund logic from `mint`. Restore `relayer.require_auth()` if we still want to restrict who can mint (or leave it open if the Passkey signature is enough). Remove the `deposit_gas_funds` function completely.

### Task 2: Standardize SDK Paymaster Integration

**Context:** The SDK should seamlessly support submitting the user's Passkey transaction to a standard Managed Paymaster (Gas Station) API.

**Files:**
- Modify: `src/services/IdentityService.ts`

- [ ] **Step 1: Update `IdentityConfig`**
Rename `relayerUrl` to `paymasterUrl` to clarify its new role.

- [ ] **Step 2: Implement Paymaster Submission Logic**
In the `connect` method, after `identity.signedTxXdr` is generated:
- If `paymasterUrl` is provided, the SDK should attempt to submit the `signedTxXdr` to that URL following a generic JSON-RPC or REST format (e.g., `{ xdr: "..." }`).
- If `paymasterUrl` is not provided, it should return `txHash: "PENDING_BROADCAST"` and let the dApp handle it.

```typescript
  // Example logic for paymaster submission
  if (this.config.paymasterUrl) {
      const response = await fetch(this.config.paymasterUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xdr: identity.signedTxXdr })
      });
      // Handle response and update txHash...
  }
```

### Task 3: Update Tests and Documentation

**Context:** The tests and README need to reflect the new Paymaster workflow.

**Files:**
- Modify: `tests/unit/identity.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Update `identity.test.ts`**
Refactor the tests for `IdentityService` to verify that it correctly uses the `paymasterUrl` and falls back to `PENDING_BROADCAST` if absent.

- [ ] **Step 2: Update `README.md`**
Update the documentation to explain how to configure the `paymasterUrl` (e.g., using a Launchtube endpoint) so that developers understand how gas is sponsored without needing their own relayer.
