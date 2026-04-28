import { rpc, Networks, Transaction } from "@stellar/stellar-sdk";
import * as Registry from "./contracts/registry";
import { HubConnectionError, ReputationLockedError } from "./errors";
import { MemoryCache } from "./cache/MemoryCache";
import { TransactionHandler } from "./tx/TransactionHandler";
import { SpokePlugin } from "./plugins/SpokePlugin";
import { WalletAdapter } from "./wallets/WalletAdapter";

export interface ZolvencyConfig {
  rpcUrl: string;
  networkPassphrase: string;
  hubAddress: string;
}

export class ZolvencySDK {
  public registry: Registry.Client;
  public txHandler: TransactionHandler;
  private rpc: rpc.Server;
  private config: ZolvencyConfig;
  private scoreCache: MemoryCache<any>;
  private plugins: Map<string, SpokePlugin> = new Map();

  constructor(config: ZolvencyConfig) {
    this.config = config;
    this.rpc = new rpc.Server(config.rpcUrl);
    this.txHandler = new TransactionHandler(this.rpc);
    this.scoreCache = new MemoryCache<any>(60); // 1 minute cache
    
    this.registry = new Registry.Client({
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      contractId: config.hubAddress,
    });
  }

  use(plugin: SpokePlugin) {
    plugin.initialize(this.rpc);
    this.plugins.set(plugin.name, plugin);
    return this;
  }

  getPlugin<T extends SpokePlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T;
  }

  async getScore(userAddress: string, skipCache = false) {
    if (!skipCache) {
      const cached = this.scoreCache.get(userAddress);
      if (cached) return cached;
    }

    try {
      const reputation = await this.registry.get_user_reputation({ user: userAddress });
      this.scoreCache.set(userAddress, reputation);
      return reputation;
    } catch (error: any) {
      throw new HubConnectionError(error.message);
    }
  }

  async isLocked(userAddress: string): Promise<boolean> {
    // @ts-ignore - is_locked might be missing in generated client but exists in contract
    return await this.registry.is_locked({ user: userAddress });
  }

  async lockReputation(userAddress: string, durationSeconds: number, wallet: WalletAdapter) {
    const unlockTimestamp = BigInt(Math.floor(Date.now() / 1000) + durationSeconds);
    console.log(`[ZolvencySDK] Preparing to lock reputation for ${userAddress} using wallet ${wallet.id}`);
    // Future: build TX, wallet.signTransaction(tx), txHandler.submitAndPoll()
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
export * from "./wallets/WalletAdapter";
export * from "./tx/TransactionHandler";
export * from "./plugins/SpokePlugin";
