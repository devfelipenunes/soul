import { describe, it, expect, vi, beforeEach } from "vitest";
import { MandateService } from "../../src/services/MandateService";

// Mock the nexus contract client
vi.mock("../../src/contracts/nexus", () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      issue_mandate: vi.fn().mockResolvedValue({
        built: { hash: () => Buffer.from("tx_hash") },
      }),
      revoke_mandate: vi.fn().mockResolvedValue({
        built: { hash: () => Buffer.from("tx_hash") },
      }),
      get_mandate: vi.fn().mockResolvedValue({
        result: { scope: { transfer_limit: 1000n } }
      }),
      get_mandate_state: vi.fn().mockResolvedValue({
        result: { spent_budget: 100n, is_revoked: false }
      }),
    }))
  };
});

// Mock the broadcaster
vi.mock("../../src/tx/Broadcaster", () => {
  return {
    TransactionBroadcaster: vi.fn().mockImplementation(() => ({
      broadcast: vi.fn().mockResolvedValue({ status: "SUCCESS", hash: "tx_hash" })
    }))
  };
});

import { TransactionBroadcaster } from "../../src/tx/Broadcaster";

describe("MandateService", () => {
  let service: MandateService;
  let broadcaster: any;

  beforeEach(() => {
    broadcaster = new TransactionBroadcaster(["http://localhost"]);
    service = new MandateService(broadcaster, {
      rpcUrl: "http://localhost",
      networkPassphrase: "test",
      nexusContractId: "C123"
    });
  });

  it("should issue a mandate", async () => {
    const hash = await service.issueMandate("issuer", "agent", 1000, 30);
    expect(hash).toBe("tx_hash");
  });

  it("should revoke a mandate", async () => {
    const hash = await service.revokeMandate("caller", 1);
    expect(hash).toBe("tx_hash");
  });

  it("should get mandate status", async () => {
    const status = await service.getMandateStatus(1);
    expect(status.spent).toBe(100n);
    expect(status.limit).toBe(1000n);
    expect(status.isRevoked).toBe(false);
  });

  it("should throw error if mandate not found", async () => {
    // Override mock for this specific test
    const nexus = (service as any).nexusClient;
    nexus.get_mandate.mockResolvedValueOnce({ result: null });

    await expect(service.getMandateStatus(1)).rejects.toThrow("Mandate #1 not found");
  });
});
