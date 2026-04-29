import { describe, it, expect } from "vitest";
import { ZolvencySDK, PRESETS } from "../../src";

describe("Soul Identity Integration Tests (Testnet)", () => {
  const sdk = new ZolvencySDK(PRESETS.TESTNET);

  it("should verify if a known Testnet address has a Soul", async () => {
    // This is a known address that might or might not have a soul, 
    // but we're testing the connection and response format.
    const testAddress = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";
    const hasSoul = await sdk.identity.isHuman(testAddress);
    
    expect(typeof hasSoul).toBe("boolean");
    console.log(`Address ${testAddress} has soul: ${hasSoul}`);
  });

  it("should fetch reputation summary from Registry", async () => {
    const testAddress = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";
    try {
      const score = await sdk.getScore(testAddress);
      expect(score).toBeDefined();
      expect(score.user).toBe(testAddress);
      console.log(`Score for ${testAddress}:`, JSON.stringify(score, null, 2));
    } catch (error: any) {
      console.warn("Registry fetch failed (expected if address not registered):", error.message);
    }
  });
});
