import { rpc, Transaction, Keypair } from "@stellar/stellar-sdk";
import { logger } from "../utils/Logger";

export class TransactionBroadcaster {
  private paymasterUrl?: string;
  private feePayerSeed?: string;
  private servers: rpc.Server[];

  constructor(rpcUrls: string[], options?: { paymasterUrl?: string; feePayerSeed?: string }) {
    if (rpcUrls.length === 0) {
      throw new Error("TransactionBroadcaster requires at least one RPC URL");
    }
    this.servers = rpcUrls.map((url) => new rpc.Server(url));
    this.paymasterUrl = options?.paymasterUrl;
    this.feePayerSeed = options?.feePayerSeed;
  }

  /**
   * Broadcasts a transaction to all configured RPC servers and polls for its confirmation.
   * If a paymasterUrl is configured, it delegates the broadcast to the paymaster.
   */
  async broadcast(
    tx: Transaction,
    pollIntervalMs = 2000,
    maxAttempts = 15
  ): Promise<rpc.Api.GetTransactionResponse> {
    const txHash = tx.hash().toString("hex");

    if (this.paymasterUrl) {
      logger.info(`Delegating broadcast of ${txHash} to paymaster: ${this.paymasterUrl}`);
      const response = await fetch(this.paymasterUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xdr: tx.toXDR() })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Paymaster failed: ${errorText}`);
      }
      
      const result = await response.json();
      // Assume paymaster returns { hash: "..." } or similar
      const actualTxHash = result.hash || result.txHash || txHash;
      return this.poll(actualTxHash, pollIntervalMs, maxAttempts);
    }

    if (this.feePayerSeed) {
      try {
        const feePayer = Keypair.fromSecret(this.feePayerSeed);
        logger.info(`Signing transaction ${txHash} with Fee Payer: ${feePayer.publicKey()}`);
        
        // Audit: check if transaction source matches fee payer
        if (tx.source !== feePayer.publicKey()) {
           logger.warn(`TX Source (${tx.source}) does NOT match Fee Payer (${feePayer.publicKey()}). This might cause txMalformed.`);
        }

        tx.sign(feePayer);
        logger.info("Transaction XDR:", tx.toXDR());
      } catch (e) {
        logger.error("Critical error signing with feePayerSeed:", e);
      }
    }

    logger.info(`Broadcasting to ${this.servers.length} servers. Network: ${tx.networkPassphrase}`);

    // Use Promise.allSettled to send the transaction to ALL servers in the pool
    const sendResults = await Promise.allSettled(
      this.servers.map((server) => server.sendTransaction(tx))
    );

    // Check for at least one successful submission (status not "ERROR")
    const successfulSubmissions = sendResults.map((result, index) => ({ result, index }))
      .filter(({ result }) => 
        result.status === "fulfilled" && result.value.status !== "ERROR"
      );

    if (successfulSubmissions.length === 0) {
      const details = sendResults.map((res) => 
        res.status === "rejected" ? res.reason : res.value
      );
      logger.error(`All servers failed to accept transaction ${txHash}`, details);
      throw new Error(`All servers failed to accept the transaction: ${JSON.stringify(details)}`);
    }

    logger.info(`Transaction ${txHash} accepted by ${successfulSubmissions.length} servers`);

    // Pick the first successful server to poll for confirmation
    const firstSuccessful = successfulSubmissions[0];
    const actualTxHash = (firstSuccessful.result as PromiseFulfilledResult<rpc.Api.SendTransactionResponse>).value.hash;

    return this.poll(actualTxHash, pollIntervalMs, maxAttempts, firstSuccessful.index);
  }

  private async poll(
    actualTxHash: string,
    pollIntervalMs: number,
    maxAttempts: number,
    serverIndex = 0
  ): Promise<rpc.Api.GetTransactionResponse> {
    const serverToPoll = this.servers[serverIndex]; // Poll from the server that accepted the tx
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const response = await serverToPoll.getTransaction(actualTxHash);
        
        if (response.status === "SUCCESS" || response.status === "FAILED") {
          logger.info(`Transaction ${actualTxHash} finalized with status: ${response.status}`);
          return response;
        }
        
        logger.debug(`Transaction ${actualTxHash} status: ${response.status} (attempt ${attempts + 1}/${maxAttempts})`);
      } catch (error) {
        logger.warn(`Polling attempt ${attempts + 1} failed for ${actualTxHash} on ${serverToPoll.serverURL.toString()}: ${error}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      attempts++;
    }

    throw new Error(`Transaction polling timed out after ${maxAttempts} attempts for ${actualTxHash}`);
  }
}
