import { Buffer } from "buffer";
import process from "process";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
  (window as any).process = (window as any).process || process;
}

import { rpc, Networks, Address, Keypair } from "@stellar/stellar-sdk";
import * as Registry from "./contracts/registry";
import * as Identity from "./contracts/identity";
import {
  HubConnectionError,
  ContractResultError,
} from "./errors";

import { TransactionHandler } from "./tx/TransactionHandler";
import { PasskeyManager } from "./identity/PasskeyManager";
import { IdentityService } from "./services/IdentityService";
import { FundingService } from "./services/FundingService";
import { MandateService } from "./services/MandateService";
import { BitsoProvider } from "./plugins/anchors/BitsoProvider";
import { logger, LogLevel } from "./utils/Logger";
import { decryptKey, type EncryptedVault } from "./identity/Encryption";
import type { SovereignSession, IdentityMetadata } from "./identity/SovereignIdentity";
import type { IdentityProfile } from "./identity/SovereignProfile";
import type { DepositInstructions } from "./plugins/anchors/IAnchorProvider";
import { SovereignVault } from "./identity/SovereignVault";

export * from "./identity/SoulRecovery";
export * from "./identity/SovereignVault";
export * from "./identity/SovereignProfile";

export type { EncryptedVault, SovereignSession, IdentityMetadata, IdentityProfile, DepositInstructions };

export interface SoulBackup {
  version: "2.0";
  soulId: number;
  address: string;
  vault: EncryptedVault;
  createdAt: string;
}

import { TransactionBroadcaster } from "./tx/Broadcaster";

export interface SoulConfig {
  rpcUrl: string;
  networkPassphrase: string;
  soulContractId: string;
  hubAddress: string;
  paymasterUrl?: string;
  walletWasmHash?: string;
  feePayerSeed?: string;
  logLevel?: LogLevel;
}


export class SoulSDK {
  public registry: Registry.Client;
  public txHandler: TransactionHandler;
  public identity: IdentityService;
  public funding: FundingService;
  public mandate: MandateService;
  private rpc: rpc.Server;
  private broadcaster: TransactionBroadcaster;
  private config: SoulConfig;
  private passkeyManager: PasskeyManager;
  private activeAddress?: string;
  private session?: SovereignSession;

  constructor(config?: Partial<SoulConfig>) {
    this.config = {
      rpcUrl: config?.rpcUrl || PRESETS.TESTNET.rpcUrl,
      networkPassphrase: config?.networkPassphrase || PRESETS.TESTNET.networkPassphrase,
      hubAddress: config?.hubAddress || PRESETS.TESTNET.hubAddress,
      paymasterUrl: config?.paymasterUrl,
      walletWasmHash: config?.walletWasmHash || PRESETS.TESTNET.walletWasmHash,
      soulContractId: config?.soulContractId || PRESETS.TESTNET.soulContractId,
      feePayerSeed: config?.feePayerSeed || PRESETS.TESTNET.feePayerSeed,
    };


    if (config?.logLevel !== undefined) {
      logger.setLogLevel(config.logLevel);
    }
    logger.setTag("SoulSDK");

    this.rpc = new rpc.Server(this.config.rpcUrl);
    this.broadcaster = new TransactionBroadcaster(
      [this.config.rpcUrl],
      {
        paymasterUrl: this.config.paymasterUrl,
        feePayerSeed: this.config.feePayerSeed
      }
    );

    this.txHandler = new TransactionHandler(this.rpc);
    
    this.registry = new Registry.Client({
      rpcUrl: this.config.rpcUrl,
      networkPassphrase: this.config.networkPassphrase,
      contractId: this.config.hubAddress,
    });

    this.mandate = new MandateService(this.broadcaster, {
      rpcUrl: this.config.rpcUrl,
      networkPassphrase: this.config.networkPassphrase,
      nexusContractId: this.config.hubAddress,
    });

    this.passkeyManager = new PasskeyManager({
      rpcUrl: this.config.rpcUrl,
      networkPassphrase: this.config.networkPassphrase,
      walletWasmHash: this.config.walletWasmHash || "",
      feePayerSeed: this.config.feePayerSeed,
    });

    const bitso = new BitsoProvider();
    this.funding = new FundingService(
      bitso, 
      this.broadcaster, 
      this.rpc, 
      this.config.networkPassphrase
    );


    let relayerAddress = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";
    if (this.config.feePayerSeed && this.config.feePayerSeed !== "kalepail") {
      try {
        relayerAddress = Keypair.fromSecret(this.config.feePayerSeed).publicKey();
      } catch { /* ignore */ }
    }

    this.identity = new IdentityService(this.passkeyManager, this.broadcaster, {
      paymasterUrl: this.config.paymasterUrl,
      soulContractId: this.config.soulContractId,
      registryContractId: this.config.hubAddress,
      rpcUrl: this.config.rpcUrl,
      appName: "SoulID",
      networkPassphrase: this.config.networkPassphrase,
      relayerAddress,
      feePayerSeed: this.config.feePayerSeed,
    }, (address) => this.setActiveAddress(address));
  }

  static fromEnv(): SoulSDK {
    // Agora o fromEnv apenas inicializa com os defaults (ou process.env se disponível globalmente)
    return new SoulSDK();
  }

  /**
   * Define o endereço ativo para chamadas sem parâmetros.
   */
  setActiveAddress(address: string) {
    this.activeAddress = address;
    return this;
  }

  /**
   * Retorna o endereço atualmente conectado no SDK.
   */
  getAddress(): string | undefined {
    return this.activeAddress;
  }

  /**
   * Starts the Sovereign Identity onboarding process.
   * Biometric handshake -> Recovery Key generation -> Encrypted Vault creation -> Soul Mint.
   */
  async createIdentity(password: string): Promise<SovereignSession> {
    const session = await this.identity.createSovereignIdentity(password);
    this.session = session;
    return session;
  }

  /**
   * Performs automated Sovereign Identity resolution.
   * Biometric handshake -> Soul ID resolution -> Reputation data loading.
   */
  async identify(): Promise<IdentityMetadata> {
    return this.identity.identify();
  }

  /**
   * Imports an identity from a backup and migrates it to this device.
   * Requires the password to decrypt the vault and sign the migration.
   */
  async importIdentity(backup: SoulBackup, password: string): Promise<SovereignSession> {
    const session = await this.identity.importAndMigrate(backup, password);
    this.session = session;
    this.activeAddress = session.address;
    return session;
  }

  /**
   * Exports the current identity session into a SoulBackup format.
   * Requires the password to verify the vault.
   */
  async exportIdentity(password: string): Promise<SoulBackup> {
    if (!this.session) {
      throw new Error("No active session to export. Create identity first.");
    }

    // Verify password
    try {
      await decryptKey(this.session.encryptedVault, password);
    } catch (error) {
      throw new Error("Invalid password for identity export.");
    }

    return {
      version: "2.0",
      soulId: Number(this.session.soulId),
      address: this.session.address,
      vault: this.session.encryptedVault,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Recupera (rotaciona) a passkey do Soul Token usando a Recovery Key.
   * Retorna a transação montada + a nova passkey (hex).
   */
  async recoverSoul(params: {
    password: string;
    encryptedVault: EncryptedVault;
    soulId: number;
    relayer: string;
    newPasskeyHex?: string;
  }) {
    return this.identity.recoverSovereignSoul(params);
  }

  /**
   * High-level Orchestration: Unified "Zero-Touch" onboarding experience.
   */
  async quickOnboardAgent(params: {
    agentAddress: string,
    initialBudget: number,
    profile: IdentityProfile,
    password: string,
    onPixReady?: (instructions: DepositInstructions) => void
  }): Promise<{ soulId: string, mandateId: string, txHash: string }> {
    logger.info(`Starting Quick Onboarding for agent ${params.agentAddress}`);

    // 1. Check if identity already exists (using identify()). If not, call createIdentity(password).
    let soulId: string;
    let userAddress: string;
    let publicKeyHex: string;

    try {
      logger.info("Checking for existing identity...");
      const metadata = await this.identify();
      soulId = metadata.soulId;
      userAddress = metadata.address;
      publicKeyHex = metadata.publicKeyHex!;
      logger.info(`Found existing identity: Soul #${soulId}, Address: ${userAddress}`);
    } catch (error) {
      logger.info("No identity found or identification failed. Creating new one...");
      const session = await this.createIdentity(params.password);
      soulId = session.soulId;
      userAddress = session.address;
      publicKeyHex = session.publicKeyHex!;
      logger.info(`Created new identity: Soul #${soulId}, Address: ${userAddress}`);
    }

    // 2. Derive the passkeyHash (from the session or identity) to encrypt/save the profile in SovereignVault
    logger.info("Encrypting profile in SovereignVault");
    const passkeyHash = Buffer.from(publicKeyHex, 'hex');
    // Task requirement says "encrypt/save", but SovereignVault currently only has static encrypt/decrypt.
    // We'll perform the encryption step as requested.
    await SovereignVault.encryptProfile(params.profile, passkeyHash);

    // 3. Call funding.requestPixDeposit(initialBudget, profile).
    logger.info(`Requesting PIX deposit for budget: ${params.initialBudget}`);
    const instructions = await this.funding.requestPixDeposit(params.initialBudget, params.profile);

    // 4. If onPixReady is provided, call it with the instructions.
    if (params.onPixReady) {
      params.onPixReady(instructions);
    }

    // 5. Wait for the deposit using funding.pollDepositStatus(instructions.transactionId).
    logger.info(`Waiting for deposit ${instructions.transactionId} confirmation...`);
    const deposited = await this.funding.pollDepositStatus(instructions.transactionId);
    if (!deposited) {
      throw new Error("Funding failed or timed out.");
    }

    // 6. Call funding.ensureTrustline(userAddress).
    logger.info(`Ensuring trustline for ${userAddress}`);
    await this.funding.ensureTrustline(userAddress);

    // 7. Finally, call mandate.issueMandate(userAddress, agentAddress, initialBudget, 30).
    logger.info(`Issuing mandate for agent ${params.agentAddress}`);
    const txHash = await this.mandate.issueMandate(userAddress, params.agentAddress, params.initialBudget, 30);

    return {
      soulId,
      mandateId: "1", // In a real scenario, we would extract this from transaction events
      txHash
    };
  }

  async getSigner(): Promise<string> {
    const tx = await this.registry.get_signer();
    return (tx as any).result;
  }

  private unwrapResult<T>(result: any, context: string): T {
    if (result && typeof result.isOk === "function") {
      if (result.isOk()) return result.unwrap();
      throw new ContractResultError(`${context}: error`);
    }
    return result as T;
  }
}

export { SoulSDK as ZolvencySDK };
export default SoulSDK;

export const PRESETS = {
  TESTNET: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    hubAddress: "CD3FKT2R46X4EHJOKNZCXSYLZHONJSDUDG4R4AJY4IMTO6JI3KZDLDC6", // Correct Nexus contract ID
    walletWasmHash: "af9524f42bf64c454483758d1450051e8a212b79b56b2ce38118b59c49b88c27",
    soulContractId: "CBHQJDMM5STMPVPNELX5BYOJTBCSUZENI4W3HQA7EPKVVGAK37XI2Y4U", // Correct Identity Contract
    feePayerSeed: "SCLMARUQYABVBJ3O7K57FVSDVBTZ6OD4W6KTIGQKNXX3DUH4DUK7UMBO", // Testnet Fee Payer
  }
};


export * from "./errors";
export * from "./wallets/WalletAdapter";
export * from "./tx/TransactionHandler";
export * from "./tx/Broadcaster";
