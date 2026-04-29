import { rpc, Networks, Address } from "@stellar/stellar-sdk";
import * as Registry from "./contracts/registry";
import * as Identity from "./contracts/identity";
import {
  HubConnectionError,
  ContractResultError,
  UnsupportedContractMethodError,
} from "./errors";
import { MemoryCache } from "./cache/MemoryCache";
import { TransactionHandler } from "./tx/TransactionHandler";
import { SpokePlugin } from "./plugins/SpokePlugin";
import { GitHubSourcePlugin } from "./plugins/GitHubSourcePlugin";
import { PasskeyManager } from "./identity/PasskeyManager";
import { IdentityService } from "./services/IdentityService";
import { logger, LogLevel } from "./utils/Logger";

export interface ZolvencyConfig {
  rpcUrl: string;
  networkPassphrase: string;
  hubAddress: string;
  githubAddress?: string;
  relayerUrl?: string;
  walletWasmHash?: string;
  soulContractId?: string;
  logLevel?: LogLevel;
}

export interface ReputationSummary {
  user: string;
  timestamp: number;
  scores: Record<string, any>;
  totalSources: number;
}

export interface GithubIdentityDetails {
  username: string;
  contributions: number;
  tier: string;
  mintedAt: Date;
  updatedAt: Date;
}

export class ZolvencySDK {
  public registry: Registry.Client;
  public txHandler: TransactionHandler;
  public identity: IdentityService;
  private rpc: rpc.Server;
  private config: ZolvencyConfig;
  private scoreCache: MemoryCache<any>;
  private plugins: Map<string, SpokePlugin> = new Map();
  private identityClients: Map<string, Identity.Client> = new Map();
  private passkeyManager: PasskeyManager;

  constructor(config?: Partial<ZolvencyConfig>) {
    this.config = {
      rpcUrl: config?.rpcUrl || PRESETS.TESTNET.rpcUrl,
      networkPassphrase: config?.networkPassphrase || PRESETS.TESTNET.networkPassphrase,
      hubAddress: config?.hubAddress || PRESETS.TESTNET.hubAddress,
      githubAddress: config?.githubAddress || PRESETS.TESTNET.githubAddress,
      relayerUrl: config?.relayerUrl || PRESETS.TESTNET.relayerUrl,
      walletWasmHash: config?.walletWasmHash || PRESETS.TESTNET.walletWasmHash,
      soulContractId: config?.soulContractId || PRESETS.TESTNET.soulContractId,
    };

    if (config?.logLevel !== undefined) {
      logger.setLogLevel(config.logLevel);
    }

    this.rpc = new rpc.Server(this.config.rpcUrl);
    this.txHandler = new TransactionHandler(this.rpc);
    this.scoreCache = new MemoryCache<any>(60);
    
    this.registry = new Registry.Client({
      rpcUrl: this.config.rpcUrl,
      networkPassphrase: this.config.networkPassphrase,
      contractId: this.config.hubAddress,
    });

    this.passkeyManager = new PasskeyManager({
      rpcUrl: this.config.rpcUrl,
      networkPassphrase: this.config.networkPassphrase,
      walletWasmHash: this.config.walletWasmHash || "",
    });

    this.identity = new IdentityService(this.passkeyManager, {
      relayerUrl: this.config.relayerUrl || "/api/passkey",
      soulContractId: this.config.soulContractId || "CAMORDN4NSRVEJAYX6KVD32JZXOYQ67G7HID6G3HX6S3A424XY7GK2ZC",
      appName: "Zolvency",
    });

    if (this.config.githubAddress) {
      this.use(new GitHubSourcePlugin(this.config.githubAddress));
    }
  }

  static fromEnv(): ZolvencySDK {
    // Agora o fromEnv apenas inicializa com os defaults (ou process.env se disponível globalmente)
    return new ZolvencySDK();
  }

  use(plugin: SpokePlugin) {
    plugin.initialize(this.rpc, {
      networkPassphrase: this.config.networkPassphrase,
      rpcUrl: this.config.rpcUrl,
      hubAddress: this.config.hubAddress,
    });
    this.plugins.set(plugin.name, plugin);
    return this;
  }

  getPlugin<T extends SpokePlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T;
  }

  async getScore(userAddress: string, skipCache = false): Promise<ReputationSummary> {
    if (!this.config.hubAddress) throw new HubConnectionError("Hub not configured");

    if (!skipCache) {
      const cached = this.scoreCache.get(userAddress);
      if (cached) return cached;
    }

    try {
      const user = new Address(userAddress);
      const reputationTx = await this.registry.get_user_reputation({ 
        user: user.toString()
      });
      
      const rawReputation = (reputationTx as any).result;
      const scores: Record<string, any> = {};

      // Parse reputation sources (simplified)
      const sources = this.normalizeReputationSources(rawReputation);

      for (const source of sources) {
        const plugin = this.getPlugin(source.name);
        let details = null;
        if (plugin && (plugin as any).getDetails) {
          details = await (plugin as any).getDetails(source.tokenId);
        }
        scores[source.name] = { tokenId: source.tokenId, details };
      }

      const finalResult: ReputationSummary = {
        user: userAddress,
        timestamp: Date.now(),
        scores,
        totalSources: Object.keys(scores).length
      };

      this.scoreCache.set(userAddress, finalResult);
      return finalResult;
    } catch (error: any) {
      throw new HubConnectionError(`[Registry] Failed to fetch score: ${error.message}`);
    }
  }

  async hasIdentity(userAddress: string, contractId?: string): Promise<boolean> {
    const client = this.getIdentityClient(contractId);
    const user = new Address(userAddress);
    const tx = await client.has_identity({ user: user.toString() });
    return (tx as any).result;
  }

  async getUserToken(userAddress: string, contractId?: string) {
    const client = this.getIdentityClient(contractId);
    const user = new Address(userAddress);
    const tx = await client.get_user_token({ user: user.toString() });
    return this.unwrapResult<bigint>((tx as any).result, "get_user_token");
  }

  async getGithubIdentityDetails(tokenId: string | number | bigint, contractId?: string): Promise<GithubIdentityDetails | null> {
    try {
      const client = this.getIdentityClient(contractId);
      const tx = await client.get_token_data({ token_id: BigInt(tokenId) });
      const data = this.unwrapResult<any>((tx as any).result, "get_token_data");
      
      return {
        username: data.username,
        contributions: Number(data.contributions),
        tier: (data.tier as any).tag || String(data.tier),
        mintedAt: new Date(Number(data.minted_at) * 1000),
        updatedAt: new Date(Number(data.updated_at) * 1000),
      };
    } catch {
      return null;
    }
  }

  private getIdentityClient(contractId?: string): Identity.Client {
    const resolved = contractId || this.config.githubAddress;
    if (!resolved) throw new HubConnectionError("Identity contract not configured");

    const existing = this.identityClients.get(resolved);
    if (existing) return existing;

    const client = new Identity.Client({
      rpcUrl: this.config.rpcUrl,
      networkPassphrase: this.config.networkPassphrase,
      contractId: resolved,
    });

    this.identityClients.set(resolved, client);
    return client;
  }

  private normalizeReputationSources(rawReputation: any): Array<{ name: string; tokenId: string }> {
    const sources: Array<{ name: string; tokenId: string }> = [];
    if (rawReputation && typeof rawReputation === "object") {
      for (const [key, value] of Object.entries(rawReputation)) {
        sources.push({ name: String(key), tokenId: String(value) });
      }
    }
    return sources;
  }

  private unwrapResult<T>(result: any, context: string): T {
    if (result && typeof result.isOk === "function") {
      if (result.isOk()) return result.unwrap();
      throw new ContractResultError(`${context}: error`);
    }
    return result as T;
  }
}

export const PRESETS = {
  TESTNET: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    hubAddress: "CAAFVZRKABOYNJV4GSFAWXSBX7F5VM3EKJ7K6RVKFVN2Z36VRKPFH3SV",
    githubAddress: "CCGK3D3WGLQWOMDDQOM2V22PZXET7PAGNGMBW6WQ7GJNVZW4B2DLUZFA",
    relayerUrl: "https://zolvency.com/api/passkey",
    walletWasmHash: "e63f90564d852a3a5223030f14643f0e0f3a5223030f14643f0e0f3a5223030",
    soulContractId: "CAMORDN4NSRVEJAYX6KVD32JZXOYQ67G7HID6G3HX6S3A424XY7GK2ZC",
  }
};

export * from "./errors";
export * from "./cache/MemoryCache";
export * from "./wallets/WalletAdapter";
export * from "./tx/TransactionHandler";
export * from "./plugins/SpokePlugin";
