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

  it("should fetch and format score successfully", async () => {
    const sdk = new ZolvencySDK(mockConfig);
    const user = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";
    const score = await sdk.getScore(user);
    
    expect(score).toBeDefined();
    expect(score.user).toBe(user);
    // The current SDK returns { '0': { tokenId: 'github,1', ... } } based on the mock
    expect(score.totalSources).toBe(1);
  });

  it("should use cache for subsequent score calls", async () => {
    const sdk = new ZolvencySDK(mockConfig);
    const user = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";
    
    const score1 = await sdk.getScore(user);
    const score2 = await sdk.getScore(user);
    
    expect(score1.timestamp).toBe(score2.timestamp);
  });
});
