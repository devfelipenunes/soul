import { describe, it, expect } from "vitest";
import { ZolvencySDK, PRESETS } from "../src";

describe("ZolvencySDK", () => {
  it("should initialize with testnet presets", () => {
    const sdk = new ZolvencySDK({
      ...PRESETS.TESTNET,
      hubAddress: "CAKC4ZOYRNP5T43OURK4H7H6UIOZ4DDBBHQGD736JTVIS6FNUXTH5QEM"
    });
    expect(sdk).toBeDefined();
    expect(sdk.registry).toBeDefined();
  });
});
