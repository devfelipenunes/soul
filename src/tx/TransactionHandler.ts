import { SorobanRpc, Transaction } from "@stellar/stellar-sdk";

export class TransactionHandler {
  constructor(private rpc: SorobanRpc.Server) {}

  /**
   * Simula a transação no Soroban RPC para estimar gás e prever falhas.
   */
  async simulate(tx: Transaction) {
    return await this.rpc.simulateTransaction(tx);
  }

  /**
   * Envia a transação assinada e faz polling (aguarda a confirmação do bloco).
   */
  async submitAndPoll(
    tx: Transaction, 
    pollIntervalMs = 2000, 
    maxAttempts = 15
  ): Promise<SorobanRpc.Api.GetTransactionResponse> {
    const response = await this.rpc.sendTransaction(tx);
    if (response.status === "ERROR") {
      throw new Error(`Transaction submission failed: ${response.errorResultXdr}`);
    }

    let attempts = 0;
    while (attempts < maxAttempts) {
      const status = await this.rpc.getTransaction(response.hash);
      if (status.status === "SUCCESS" || status.status === "FAILED") {
        return status;
      }
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      attempts++;
    }
    throw new Error("Transaction timeout");
  }
}
