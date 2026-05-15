import { describe, it, expect, vi, beforeEach } from "vitest";
import { FundingService } from "../../src/services/FundingService";
import { BitsoProvider } from "../../src/plugins/anchors/BitsoProvider";
import { TransactionBroadcaster } from "../../src/tx/Broadcaster";
import { rpc, Networks } from "@stellar/stellar-sdk";

vi.mock("../../src/tx/Broadcaster");
vi.mock("@stellar/stellar-sdk", async () => {
  const actual = await vi.importActual("@stellar/stellar-sdk") as any;
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: vi.fn().mockImplementation(() => ({
        getAccount: vi.fn(),
      })),
    },
  };
});

describe("FundingService", () => {
  let fundingService: FundingService;
  let provider: BitsoProvider;
  let broadcaster: any;
  let rpcServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new BitsoProvider();
    broadcaster = new TransactionBroadcaster(["http://mock-rpc"]);
    rpcServer = new rpc.Server("http://mock-rpc");
    fundingService = new FundingService(provider, broadcaster, rpcServer, Networks.TESTNET);
  });

  it("should request deposit instructions correctly", async () => {
    const profile = {
      fullName: "John Doe",
      taxId: "123.456.789-00",
      preferredCurrency: "BRL" as const,
    };
    const instructions = await fundingService.requestPixDeposit(100, profile);
    
    expect(instructions.type).toBe("pix");
    expect(instructions.pixKey).toBeDefined();
    expect(instructions.qrCode).toBeDefined();
    expect(instructions.transactionId).toMatch(/^tx_/);
  });

  it("should poll deposit status until completed", async () => {
    vi.spyOn(provider, "getTransactionStatus")
      .mockResolvedValueOnce("pending" as any)
      .mockResolvedValueOnce("completed" as any);

    const result = await fundingService.pollDepositStatus("mock_tx", 10);
    expect(result).toBe(true);
    expect(provider.getTransactionStatus).toHaveBeenCalledTimes(2);
  });

  it("should return false if deposit fails during polling", async () => {
    vi.spyOn(provider, "getTransactionStatus").mockResolvedValue("failed" as any);

    const result = await fundingService.pollDepositStatus("mock_tx", 10);
    expect(result).toBe(false);
  });

  it("should ensure trustline if missing", async () => {
    const userAddress = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";
    rpcServer.getAccount.mockResolvedValue({
      sequence: "1",
      balances: [], // No trustlines
    });

    broadcaster.broadcast.mockResolvedValue({ status: "SUCCESS", hash: "hash123" });

    const txHash = await fundingService.ensureTrustline(userAddress);
    
    expect(txHash).toBe("hash123");
    expect(rpcServer.getAccount).toHaveBeenCalledWith(userAddress);
    expect(broadcaster.broadcast).toHaveBeenCalled();
  });

  it("should skip creating trustline if it already exists", async () => {
    const userAddress = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";
    rpcServer.getAccount.mockResolvedValue({
      sequence: "1",
      balances: [
        { asset_code: "BRLT", asset_issuer: "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75" }
      ],
    });

    const txHash = await fundingService.ensureTrustline(userAddress);
    
    expect(txHash).toBeNull();
    expect(broadcaster.broadcast).not.toHaveBeenCalled();
  });
});
