import { describe, it, expect } from "vitest";
import { ZolvencySDK, PRESETS } from "../../src";

describe("ZolvencySDK Configuration", () => {
  it("should initialize with default TESTNET rpcUrl if none provided", () => {
    const sdk = new ZolvencySDK();
    const broadcaster = (sdk as any).broadcaster;
    expect(broadcaster).toBeDefined();
    // New SDK uses a single rpcUrl in Broadcaster
    expect((broadcaster as any).servers.length).toBe(1);
    expect((broadcaster as any).servers[0].serverURL.toString()).toBe(PRESETS.TESTNET.rpcUrl + "/");
  });

  it("should initialize with custom rpcUrl", () => {
    const customRpc = "https://custom-rpc.com";
    const sdk = new ZolvencySDK({ rpcUrl: customRpc });
    const broadcaster = (sdk as any).broadcaster;
    expect((broadcaster as any).servers.length).toBe(1);
    expect((broadcaster as any).servers[0].serverURL.toString()).toBe(customRpc + "/");
  });

  it("should initialize with custom config and set correct server", () => {
    const customRpc = "https://rpc-test.com";
    const sdk = new ZolvencySDK({ 
      rpcUrl: customRpc,
      networkPassphrase: "Custom Passphrase",
      hubAddress: "CONTRACT123"
    });
    const broadcaster = (sdk as any).broadcaster;
    expect((broadcaster as any).servers[0].serverURL.toString()).toBe(customRpc + "/");
  });
});
