import * as Nexus from "../contracts/nexus";
import { TransactionBroadcaster } from "../tx/Broadcaster";
import { logger } from "../utils/Logger";
import { Contract, nativeToScVal, xdr, TransactionBuilder, Account, rpc } from "@stellar/stellar-sdk";

export interface MandateStatus {
  spent: bigint;
  limit: bigint;
  isRevoked: boolean;
}

export class MandateService {
  private nexusClient: Nexus.Client;
  private broadcaster: TransactionBroadcaster;

  constructor(broadcaster: TransactionBroadcaster, config: {
    rpcUrl: string;
    networkPassphrase: string;
    nexusContractId: string;
  }) {
    this.broadcaster = broadcaster;
    this.nexusClient = new Nexus.Client({
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      contractId: config.nexusContractId,
      publicKey: "GA37WDBK5OZ42SENCXVIJZSGPO36TLLPIRMWTL554JP5ZITFCRCJA4SU", // Use a valid G... address as source
    });
  }

  /**
   * Issues a new mandate to an agent with a specific spending limit and TTL.
   */
  async issueMandate(issuer: string, agent: string, limit: number | bigint, ttlDays: number): Promise<string> {
    const ttl = BigInt(Math.floor(Date.now() / 1000) + (ttlDays * 24 * 60 * 60));
    logger.info(`Issuing mandate: issuer=${issuer}, agent=${agent}, limit=${limit}, ttlDays=${ttlDays}`);

    // Use a manual approach to ensure the source account is handled correctly
    const sourceAddress = "GA37WDBK5OZ42SENCXVIJZSGPO36TLLPIRMWTL554JP5ZITFCRCJA4SU";
    
    // Import SDK components (Now static)
    const contract = new Contract(this.nexusClient.options.contractId);
    
    const scopeMap = [
      new xdr.ScMapEntry({
          key: nativeToScVal("contract_allowlist", { type: "symbol" }),
          val: nativeToScVal(null)
      }),
      new xdr.ScMapEntry({
          key: nativeToScVal("expiration", { type: "symbol" }),
          val: nativeToScVal(BigInt(ttl), { type: "u64" })
      }),
      new xdr.ScMapEntry({
          key: nativeToScVal("function_allowlist", { type: "symbol" }),
          val: nativeToScVal(null)
      }),
      new xdr.ScMapEntry({
          key: nativeToScVal("metadata_uri", { type: "symbol" }),
          val: nativeToScVal(null)
      }),
      new xdr.ScMapEntry({
          key: nativeToScVal("renewal_period", { type: "symbol" }),
          val: nativeToScVal(null)
      }),
      new xdr.ScMapEntry({
          key: nativeToScVal("scope_commitment", { type: "symbol" }),
          val: nativeToScVal(null)
      }),
      new xdr.ScMapEntry({
          key: nativeToScVal("token", { type: "symbol" }),
          val: nativeToScVal(null)
      }),
      new xdr.ScMapEntry({
          key: nativeToScVal("transfer_limit", { type: "symbol" }),
          val: nativeToScVal(BigInt(Math.floor(Number(limit) * 10000000)), { type: "i128" })
      }),
    ];

    const scopeVal = xdr.ScVal.scvMap(scopeMap);
    const policyVal = xdr.ScVal.scvVec([nativeToScVal("Full", { type: "symbol" })]);

    const op = contract.call("issue_mandate_as_admin",
        nativeToScVal(issuer, { type: "address" }),
        nativeToScVal(agent, { type: "address" }),
        scopeVal,
        policyVal,
        nativeToScVal(null) // parent_mandate_id
    );

    // Fetch account for sequence number
    const rpcServer = new rpc.Server(this.nexusClient.options.rpcUrl);
    const accountResponse = await rpcServer.getAccount(sourceAddress);
    
    const tx = new TransactionBuilder(accountResponse, {
      fee: "2000",
      networkPassphrase: this.nexusClient.options.networkPassphrase,
    })
    .addOperation(op)
    .setTimeout(60)
    .build();

    // Simulate and assemble (crucial for Soroban resources)
    logger.info("Simulating manual transaction...");
    const simulation = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${JSON.stringify(simulation.error)}`);
    }

    const assembledTx = rpc.assembleTransaction(tx, simulation).build();

    const result = await this.broadcaster.broadcast(assembledTx as any);
    if (result.status !== "SUCCESS") {
      throw new Error(`Mandate issuance failed: ${result.status}`);
    }

    return (result as any).txHash || (result as any).hash;
  }

  /**
   * Revokes an existing mandate.
   */
  async revokeMandate(caller: string, mandateId: number | bigint): Promise<string> {
    logger.info(`Revoking mandate #${mandateId} by ${caller}`);

    const assembled = await this.nexusClient.revoke_mandate({
      caller,
      mandate_id: BigInt(mandateId),
    });

    const tx = (assembled as any).built || (assembled as any).transaction;
    if (!tx) throw new Error("Failed to build revoke_mandate transaction");

    const result = await this.broadcaster.broadcast(tx);
    if (result.status !== "SUCCESS") {
      throw new Error(`Mandate revocation failed: ${result.status}`);
    }

    return (result as any).hash;
  }

  /**
   * Fetches the status of a mandate, including spent amount, limit, and revocation status.
   */
  async getMandateStatus(mandateId: number | bigint): Promise<MandateStatus> {
    const mandateIdBI = BigInt(mandateId);
    
    logger.info(`Fetching status for mandate #${mandateId}`);

    const [mandateRes, stateRes] = await Promise.all([
      this.nexusClient.get_mandate({ id: mandateIdBI }),
      this.nexusClient.get_mandate_state({ mandate_id: mandateIdBI })
    ]);

    const mandate = (mandateRes as any).result;
    const state = (stateRes as any).result;

    if (!mandate || !state) {
      throw new Error(`Mandate #${mandateId} not found`);
    }

    return {
      spent: state.spent_budget,
      limit: mandate.scope.transfer_limit || 0n,
      isRevoked: state.is_revoked,
    };
  }

  /**
   * Builds an unsigned transaction to approve a spender on a token contract.
   * Useful for Smart Wallets to sign via Passkey.
   */
  async buildApproveTransaction(owner: string, spender: string, amount: number | bigint, token: string): Promise<string> {
    const rpcServer = new rpc.Server(this.nexusClient.options.rpcUrl);
    
    // IMPORTANTE: Para Smart Wallets (C...), a conta de origem da transação Stellar 
    // DEVE ser um endereço G... (Relayer). A autorização da Smart Wallet ocorre internamente.
    const relayerAddress = "GA37WDBK5OZ42SENCXVIJZSGPO36TLLPIRMWTL554JP5ZITFCRCJA4SU";
    const accountResponse = await rpcServer.getAccount(relayerAddress);
    
    // Buscar o ledger atual para calcular o live_until (limite do Soroban SAC)
    const latestLedger = (await rpcServer.getLatestLedger()).sequence;
    const liveUntil = latestLedger + 3000000;

    const contract = new Contract(token);
    const tx = new TransactionBuilder(accountResponse, {
      fee: "2000",
      networkPassphrase: this.nexusClient.options.networkPassphrase,
    })
    .addOperation(contract.call(
      "approve",
      nativeToScVal(owner, { type: "address" }),
      nativeToScVal(spender, { type: "address" }),
      nativeToScVal(BigInt(Math.floor(Number(amount) * 10000000)), { type: "i128" }),
      nativeToScVal(liveUntil, { type: "u32" })
    ))
    .setTimeout(60)
    .build();

    const simulation = await rpcServer.simulateTransaction(tx);
    const assembledTx = rpc.assembleTransaction(tx, simulation).build();
    return assembledTx.toXDR();
  }
}
