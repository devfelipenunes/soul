# SoulID SDK 🛡️

The professional TypeScript SDK for **SoulID (Zolvency)**. Build trust-based DeFi applications on Stellar and EVM with ease.

[![CI](https://github.com/devfelipenunes/zolvency-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/devfelipenunes/zolvency-sdk/actions)
[![NPM Version](https://img.shields.io/npm/v/@zolvency/sdk.svg)](https://www.npmjs.com/package/@zolvency/sdk)

## Features

- **Biometric Identity**: Integrated Passkey support for "Atomic Onboarding" (Wallet + Identity in one click).
- **Sovereign Identity (NEW)**: Password-protected recovery mechanisms using P-256 keys and encrypted vaults.
- **Soulbound Tokens (SBT)**: Manage non-transferable reputation tokens linked to biometric proof.
- **Hub Aggregation**: Fetch consolidated reputation scores across all Zolvency Spokes.
- **Cross-Chain Ready**: Seamlessly manage reputation between Stellar (Soroban) and EVM (Axelar/LayerZero).

## Installation

```bash
npm install zolvency-sdk
# or
yarn add zolvency-sdk
```

## Quick Start

### 1. Initialize the SDK
```typescript
import { ZolvencySDK, PRESETS } from "zolvency-sdk";

// Initialize with Testnet presets. 
const sdk = new ZolvencySDK({
  ...PRESETS.TESTNET,
  paymasterUrl: "/api/passkey" // Optional: proxy to a relay/paymaster
});
```

### 2. Sovereign Identity (With Recovery)
The Sovereign flow allows users to recover their identity if they lose their biometric device by using a password-protected encrypted vault.

```typescript
// 1. Create a Sovereign Identity (Bio + Recovery Key)
const password = "my-secret-password";
const session = await sdk.createIdentity(password);

console.log("Encrypted Vault (Save this!):", session.encryptedVault);
console.log("Stellar Address:", session.address);

// 2. Identify Yourself (Biometric Handshake)
const identity = await sdk.identify();
console.log("Soul ID:", identity.soulId);
console.log("Reputation Data:", identity.reputation);

// 3. Recover Access (If device is lost)
const result = await sdk.recoverSoul({
  soulId: 1, // Your numeric Soul ID
  password: "my-secret-password",
  encryptedVault: savedVault, // The JSON you saved during creation
  relayer: "G...SENDER_ADDRESS" // Account paying for the recovery TX
});
```

### 3. Simple Onboarding (Anonymous)
For apps that don't need recovery, use the one-click biometric flow.

```typescript
const session = await sdk.identity.connect();
console.log("Wallet Address:", session.address);
```

### 4. Reputation & Metadata
```typescript
// Get consolidated score (Registry Hub)
const score = await sdk.getScore("G...ADDRESS");

// Get full Soul Passport metadata (SVG + Details)
const passport = await sdk.getSoulMetadata("G...ADDRESS");
console.log("GitHub Username:", passport.metadata.username);
```

## Security Model
Zolvency Sovereign Identity uses a hybrid model:
- **Daily Access**: Biometric Passkeys (TPM/Enclave based).
- **Recovery**: A P-256 keypair generated locally, where the private key is encrypted with PBKDF2/AES-GCM using the user's password and stored as an `EncryptedVault`. The public key is stored on-chain.

## Build & Test

```bash
npm run build
npm test
```

## Documentation

For deep technical dives into the protocol, check out the [Zolvency Architecture](https://github.com/devfelipenunes/zolvency-contracts/blob/main/docs/architecture/ARCHITECTURE.md).

## License

MIT © Felipe Nunes
