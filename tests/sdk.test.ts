import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZolvencySDK, PRESETS } from "../src";
import { Address } from "@stellar/stellar-sdk";

// Mock the Registry client
vi.mock("../src/contracts/registry", () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      get_signer: vi.fn().mockResolvedValue({ result: "GADMIN..." }),
      get_user_reputation: vi.fn().mockResolvedValue({ 
        result: [["github", BigInt(1)]] 
      }),
      get_soul_reputation: vi.fn().mockResolvedValue({
        result: [["github", BigInt(1)]]
      }),
    })),
  };
});

describe("ZolvencySDK Unit Tests", () => {
  const mockConfig = {
    rpcUrl: "https://mock-rpc.com",
    networkPassphrase: "Mock Passphrase",
    hubAddress: "CAAFVZRKABOYNJV4GSFAWXSBX7F5VM3EKJ7K6RVKFVN2Z36VRKPFH3SV",
  };

  it("should initialize with custom config", () => {
    const sdk = new ZolvencySDK(mockConfig);
    expect(sdk).toBeDefined();
    expect(sdk.registry).toBeDefined();
  });

  it("should initialize from environment variables", () => {
    process.env.ZOLVENCY_HUB_ADDRESS = mockConfig.hubAddress;
    const sdk = ZolvencySDK.fromEnv();
    expect(sdk).toBeDefined();
  });

  it("should fetch signer successfully", async () => {
    const sdk = new ZolvencySDK(mockConfig);
    const signerTx = await sdk.registry.get_signer();
    expect(signerTx.result).toBe("GADMIN...");
  });
});
