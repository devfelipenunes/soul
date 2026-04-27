import { SorobanRpc, Networks } from "@stellar/stellar-sdk";
import * as Registry from "../packages/zolvency-registry";
import * as Identity from "../packages/github-identity";

export interface ZolvencyConfig {
  rpcUrl: string;
  networkPassphrase: string;
  hubAddress: string;
}

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
   * Returns a map of token types and their IDs.
   */
  async getScore(userAddress: string) {
    try {
      const reputation = await this.registry.get_user_reputation({ user: userAddress });
      return reputation;
    } catch (error) {
      console.error("Error fetching Zolvency score:", error);
      throw error;
    }
  }

  /**
   * Lock a user's reputation for a specific duration.
   * Requires the caller to be an authorized Lending protocol.
   */
  async lockReputation(userAddress: string, durationSeconds: number) {
    // Current time + duration
    const unlockTimestamp = BigInt(Math.floor(Date.now() / 1000) + durationSeconds);
    
    // Note: This requires signing. The SDK would typically be used with a wallet provider.
    // This is a placeholder for the logic.
    console.log(`Requesting lock for ${userAddress} until ${unlockTimestamp}`);
  }
}

export const PRESETS = {
  TESTNET: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    hubAddress: "C...", // Replace with real ID
  }
};
