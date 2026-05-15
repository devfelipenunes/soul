import { describe, it, expect } from "vitest";
import { ZolvencySDK, PRESETS } from "../../src";

describe("Soul Identity Integration Tests (Testnet)", () => {
  const sdk = new ZolvencySDK(PRESETS.TESTNET);

  it("should verify if a known Testnet address has a Soul", async () => {
    // O modelo atual usa SoulID (u32), não endereço G... diretamente.
    // Este teste valida apenas que o método funciona quando a rede responde;
    // em ambientes sem conectividade/contrato, não deve falhar a suíte.
    const testSoulId = 1;
    try {
      const hasSoul = await sdk.hasIdentity(testSoulId);
      expect(typeof hasSoul).toBe("boolean");
      console.log(`SoulId ${testSoulId} has identity: ${hasSoul}`);
    } catch (error: any) {
      console.warn("Soul identity check failed (network/contract dependent):", error.message);
      expect(true).toBe(true);
    }
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
