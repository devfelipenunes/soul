import { rpc, Transaction } from "@stellar/stellar-sdk";

export class TransactionHandler {
  constructor(private rpc: rpc.Server) {}

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
  ): Promise<rpc.Api.GetTransactionResponse> {
    const response = await this.rpc.sendTransaction(tx);
    
    // Check if the transaction was sent successfully
    if (response.status === "ERROR") {
      // In SDK v13+, the error details might be in errorResult or other fields
      throw new Error(`Transaction submission failed: ${JSON.stringify(response)}`);
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
