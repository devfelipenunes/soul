import { SorobanRpc, Networks, Transaction } from "@stellar/stellar-sdk";
import * as Registry from "../packages/zolvency-registry";
import { HubConnectionError, ReputationLockedError } from "./errors";

export interface ZolvencyConfig {
  rpcUrl: string;
  networkPassphrase: string;
  hubAddress: string;
}

export type SignerProvider = (tx: Transaction) => Promise<Transaction>;

export class ZolvencySDK {
  public registry: Registry.Client;
  private config: ZolvencyConfig;

  constructor(config: ZolvencyConfig) {
    this.config = config;
    this.registry = new Registry.Client({
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      contractId: config.hubAddress,
    });
  }

  /**
   * Get the aggregate reputation score for a user.
   */
  async getScore(userAddress: string) {
    try {
      const reputation = await this.registry.get_user_reputation({ user: userAddress });
      return reputation;
    } catch (error: any) {
      throw new HubConnectionError(error.message);
    }
  }

  /**
   * Check if a user's reputation is currently locked.
   */
  async isLocked(userAddress: string): Promise<boolean> {
    const locked = await this.registry.is_locked({ user: userAddress });
    return locked;
  }

  /**
   * Lock a user's reputation. Requires an authorized signer.
   */
  async lockReputation(userAddress: string, durationSeconds: number, signer: SignerProvider) {
    const unlockTimestamp = BigInt(Math.floor(Date.now() / 1000) + durationSeconds);
    
    // Logic for building and signing the lock transaction would go here
    console.log(`Requesting lock for ${userAddress} until ${unlockTimestamp}`);
  }
}

export const PRESETS = {
  TESTNET: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    hubAddress: "", 
  }
};

export * from "./errors";
export * from "./cache/MemoryCache";
