import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionBroadcaster } from "../../src/tx/Broadcaster";
import { rpc, Transaction, Networks, Account, Operation, Keypair, Asset, TransactionBuilder } from "@stellar/stellar-sdk";

// Mock @stellar/stellar-sdk partially
vi.mock("@stellar/stellar-sdk", async () => {
  const actual = await vi.importActual("@stellar/stellar-sdk") as any;
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: vi.fn().mockImplementation((url) => ({
        serverURL: new URL(url),
        sendTransaction: vi.fn(),
        getTransaction: vi.fn(),
      })),
    },
  };
});

describe("TransactionBroadcaster", () => {
  const rpcUrls = ["https://rpc1.com", "https://rpc2.com"];
  let broadcaster: TransactionBroadcaster;
  let mockTx: Transaction;

  beforeEach(() => {
    vi.clearAllMocks();
    broadcaster = new TransactionBroadcaster(rpcUrls);
    
    const source = Keypair.random();
    const account = new Account(source.publicKey(), "1");
    mockTx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
    .addOperation(Operation.payment({
      destination: source.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }))
    .setTimeout(0)
    .build();
  });

  it("should initialize with multiple servers", () => {
    expect(broadcaster).toBeDefined();
    expect(rpc.Server).toHaveBeenCalledTimes(2);
    expect(rpc.Server).toHaveBeenCalledWith(rpcUrls[0]);
    expect(rpc.Server).toHaveBeenCalledWith(rpcUrls[1]);
  });

  it("should throw if no RPC URLs are provided", () => {
    expect(() => new TransactionBroadcaster([])).toThrow();
  });

  it("should broadcast to all servers and return status if at least one succeeds", async () => {
    const servers = (broadcaster as any).servers;
    
    // Server 1 fails to accept
    servers[0].sendTransaction.mockResolvedValue({ status: "ERROR", errorResultXdr: "err1" });
    // Server 2 accepts
    servers[1].sendTransaction.mockResolvedValue({ status: "PENDING", hash: "hash123" });
    
    // Polling on Server 2
    servers[1].getTransaction.mockResolvedValue({ status: "SUCCESS", txHash: "hash123" });

    const result = await broadcaster.broadcast(mockTx);
    
    expect(servers[0].sendTransaction).toHaveBeenCalledWith(mockTx);
    expect(servers[1].sendTransaction).toHaveBeenCalledWith(mockTx);
    expect(result.status).toBe("SUCCESS");
    expect(servers[1].getTransaction).toHaveBeenCalledWith("hash123");
  });

  it("should throw error if all servers return ERROR", async () => {
    const servers = (broadcaster as any).servers;
    servers[0].sendTransaction.mockResolvedValue({ status: "ERROR", errorResultXdr: "err1" });
    servers[1].sendTransaction.mockResolvedValue({ status: "ERROR", errorResultXdr: "err2" });

    await expect(broadcaster.broadcast(mockTx)).rejects.toThrow("All servers failed to accept the transaction");
  });

  it("should throw error if all servers reject the promise", async () => {
    const servers = (broadcaster as any).servers;
    servers[0].sendTransaction.mockRejectedValue(new Error("network error 1"));
    servers[1].sendTransaction.mockRejectedValue(new Error("network error 2"));

    await expect(broadcaster.broadcast(mockTx)).rejects.toThrow("All servers failed to accept the transaction");
  });

  it("should retry polling until SUCCESS or FAILED", async () => {
    const servers = (broadcaster as any).servers;
    servers[0].sendTransaction.mockResolvedValue({ status: "PENDING", hash: "hash123" });
    servers[1].sendTransaction.mockResolvedValue({ status: "PENDING", hash: "hash123" });

    // Poll 1: PENDING
    // Poll 2: SUCCESS
    servers[0].getTransaction
      .mockResolvedValueOnce({ status: "NOT_FOUND" })
      .mockResolvedValueOnce({ status: "SUCCESS", hash: "hash123" });

    const result = await broadcaster.broadcast(mockTx, 10, 5);
    
    expect(result.status).toBe("SUCCESS");
    expect(servers[0].getTransaction).toHaveBeenCalledTimes(2);
  });

  it("should throw timeout error if maxAttempts reached", async () => {
    const servers = (broadcaster as any).servers;
    servers[0].sendTransaction.mockResolvedValue({ status: "PENDING", hash: "hash123" });
    servers[1].sendTransaction.mockResolvedValue({ status: "PENDING", hash: "hash123" });

    servers[0].getTransaction.mockResolvedValue({ status: "NOT_FOUND" });

    await expect(broadcaster.broadcast(mockTx, 1, 3)).rejects.toThrow("Transaction polling timed out");
  });
});
