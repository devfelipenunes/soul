import { SorobanRpc, Networks } from "@stellar/stellar-sdk";

export interface ZolvencyConfig {
  rpcUrl: string;
  networkPassphrase: string;
  hubAddress: string;
}

export class ZolvencySDK {
  private rpc: SorobanRpc.Server;
  private config: ZolvencyConfig;

  constructor(config: ZolvencyConfig) {
    this.config = config;
    this.rpc = new SorobanRpc.Server(config.rpcUrl);
  }

  /**
   * Get the aggregate reputation score for a user.
   */
  async getScore(userAddress: string) {
    console.log(`Fetching score for ${userAddress} from Hub at ${this.config.hubAddress}`);
    return { score: 0, tiers: [] };
  }

  /**
   * Lock a user's reputation for a specific duration.
   */
  async lockReputation(userAddress: string, durationSeconds: number) {
    console.log(`Locking reputation for ${userAddress} for ${durationSeconds}s`);
  }
}

export const PRESETS = {
  TESTNET: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    hubAddress: "", 
  },
  PUBLIC: {
    rpcUrl: "https://soroban-rpc.mainnet.stellar.org",
    networkPassphrase: Networks.PUBLIC,
    hubAddress: "", 
  }
};
