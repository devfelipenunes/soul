# @zolvency/sdk 🛡️

The professional TypeScript SDK for the **Zolvency Protocol**. Build trust-based DeFi applications on Stellar and EVM with ease.

[![CI](https://github.com/devfelipenunes/zolvency-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/devfelipenunes/zolvency-sdk/actions)
[![NPM Version](https://img.shields.io/npm/v/@zolvency/sdk.svg)](https://www.npmjs.com/package/@zolvency/sdk)

## Features

- **Hub Aggregation**: Fetch consolidated reputation scores across all Zolvency Spokes.
- **Cross-Chain Ready**: Seamlessly manage reputation between Stellar (Soroban) and EVM (Axelar/LayerZero).
- **Type-Safe**: Full TypeScript support with auto-generated Soroban bindings.
- **Armor Up Security**: Built-in support for reputation locking and slashing.

## Installation

```bash
npm install @zolvency/sdk
# or
yarn add @zolvency/sdk
```

## Quick Start

### 1. Initialize the SDK
```typescript
import { ZolvencySDK, PRESETS } from "@zolvency/sdk";

const sdk = new ZolvencySDK({
  ...PRESETS.TESTNET,
  hubAddress: "CONTRACT_ID_HERE"
});
```

### 2. Fetch User Reputation
```typescript
const userScore = await sdk.getScore("G...USER_ADDRESS");
console.log("Aggregate Reputation:", userScore);
```

### 3. Lock Reputation (For Lending Protocols)
```typescript
// Lock for 30 days
await sdk.lockReputation("G...USER_ADDRESS", 60 * 60 * 24 * 30);
```

## Documentation

For deep technical dives into the protocol, check out the [Zolvency Architecture](https://github.com/devfelipenunes/zolvency-contracts/blob/main/docs/architecture/ARCHITECTURE.md).

## License

MIT © Felipe Nunes
