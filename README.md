# @zolvency/sdk 🛡️

The professional TypeScript SDK for the **Zolvency Protocol**. Build trust-based DeFi applications on Stellar and EVM with ease.

[![CI](https://github.com/devfelipenunes/zolvency-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/devfelipenunes/zolvency-sdk/actions)
[![NPM Version](https://img.shields.io/npm/v/@zolvency/sdk.svg)](https://www.npmjs.com/package/@zolvency/sdk)

## Features

- **Biometric Identity**: Integrated Passkey support for "Atomic Onboarding" (Wallet + Identity in one click).
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

const sdk = new ZolvencySDK(PRESETS.TESTNET);
```

### 2. Biometric Onboarding (Soul Connect)
```typescript
// Registers a Passkey, Deploys a Smart Wallet, and Mints a Soul Token
const session = await sdk.identity.connect("username");
console.log("Welcome,", session.username);
console.log("Wallet Address:", session.address);
console.log("Soul ID:", session.soulId);
```

### 3. Verify Human Identity
```typescript
const isHuman = await sdk.identity.isHuman("G...USER_ADDRESS");
if (isHuman) {
  console.log("This user has a verified biometric identity.");
}
```

### 4. Fetch User Reputation Summary
```typescript
const summary = await sdk.getScore("G...USER_ADDRESS");
console.log("GitHub Tier:", summary.scores.github.details.tier);
```

## Build & Test

```bash
npm run build
npm test
```

## Documentation

For deep technical dives into the protocol, check out the [Zolvency Architecture](https://github.com/devfelipenunes/zolvency-contracts/blob/main/docs/architecture/ARCHITECTURE.md).

## License

MIT © Felipe Nunes
