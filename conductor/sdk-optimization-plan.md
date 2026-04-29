# SDK Optimization & Soul Finalization Plan (v0.1.4)

## Objective
Finalize and optimize the Zolvency SDK for a Browser-First environment, resolving build crashes and test failures related to Node.js modules and nested dependencies. Implement robust integration tests for the "Soul" (SBT) logic against the Stellar Testnet, and automate the NPM publishing process via CI/CD.

## Scope & Impact
- **Build**: Lighter browser bundle, free of Node.js `util`/`stream` crashes.
- **Testing**: Reliable test suite that verifies the core identity infrastructure (SBT minting and verification) on Testnet, preventing regressions.
- **CI/CD**: Automated publishing pipeline ensuring clean releases.

## Implementation Steps

### 1. Build Optimization & Dependency Resolution
- Add an `overrides` (for npm) section in `package.json` to enforce a single version of `@stellar/stellar-sdk` across the project, eliminating the `MODULE_NOT_FOUND` bug caused by `passkey-kit`'s nested dependency.
- Refine the `tsup` configuration (via `package.json` script or `tsup.config.ts`) to explicitly target `--platform browser`, ensuring Node.js built-ins are excluded or shimmed, while keeping peer dependencies external.

### 2. Identity Service Validation & Integration Tests
- Create a dedicated integration test suite at `tests/integration/soul.test.ts`.
- Write test cases verifying the `IdentityService` methods against the Stellar Testnet:
  - `isHuman`: Verify SBT ownership for a known Testnet address.
  - `mintSoul` / `connect`: Validate the contract interaction logic (using Testnet credentials and RPC endpoints).
- Set up a `.env.test` file or secure environment variables for test execution.

### 3. NPM Optimization & CI/CD
- Create a GitHub Actions workflow (`.github/workflows/npm-publish.yml`) to automatically run tests, build the SDK, and publish to NPM when a release tag (e.g., `v*`) is pushed.
- Enhance `README.md` with updated Developer Experience (DX) documentation, including clear code snippets for utilizing the "Soul" identity flows in a browser frontend.

## Verification & Testing
- Run `npm run build` and inspect the `/dist` output to ensure it does not bundle `stellar-sdk` or Node built-ins.
- Run `npm test` to confirm the `MODULE_NOT_FOUND` error is resolved and all integration tests pass against Testnet.
- Verify the CI/CD workflow triggers correctly on a dummy commit/tag (if applicable).