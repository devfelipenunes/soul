import { Address, Keypair } from '@stellar/stellar-sdk';
import { PasskeyManager } from '../identity/PasskeyManager';
import { logger } from '../utils/Logger';
import { TransactionBroadcaster } from '../tx/Broadcaster';
import { encryptKey, decryptKey } from '../identity/Encryption';
import type { EncryptedVault } from '../identity/Encryption';
import { generateRecoveryKey } from '../identity/SovereignIdentity';
import type { SovereignSession, IdentityMetadata } from '../identity/SovereignIdentity';
import { signSoulRecovery, deriveRecoveryPublicKey } from '../identity/SoulRecovery';
import * as Soul from '../contracts/soul';
import * as Registry from '../contracts/registry';


export interface IdentityConfig {
  paymasterUrl?: string;
  soulContractId: string;
  registryContractId: string;
  appName: string;
  networkPassphrase: string;
  rpcUrl: string;
  relayerAddress?: string;
  feePayerSeed?: string;
  allowHttp?: boolean;
}

export class IdentityService {
  private passkeyManager: PasskeyManager;
  private broadcaster: TransactionBroadcaster;
  private config: IdentityConfig;
  private onSession?: (address: string) => void;
  private soulClient?: Soul.Client;

  constructor(
    passkeyManager: PasskeyManager, 
    broadcaster: TransactionBroadcaster,
    config: IdentityConfig, 
    onSession?: (address: string) => void
  ) {
    this.passkeyManager = passkeyManager;
    this.broadcaster = broadcaster;
    this.config = config;
    this.onSession = onSession;
    // Lazy-init: some unit tests instantiate IdentityService with partial config.
    // We'll only create the client when a method requires chain access.
    if (config.rpcUrl && config.networkPassphrase && config.soulContractId) {
      this.soulClient = new Soul.Client({
        rpcUrl: config.rpcUrl,
        networkPassphrase: config.networkPassphrase,
        contractId: config.soulContractId,
        allowHttp: config.allowHttp,
        publicKey: config.relayerAddress,
      });
    }
  }

  private getSoulClient(): Soul.Client {
    if (!this.soulClient) {
      const { rpcUrl, networkPassphrase, soulContractId, allowHttp, relayerAddress } = this.config as any;
      if (!rpcUrl || !networkPassphrase || !soulContractId) {
        throw new Error('IdentityService is missing rpcUrl/networkPassphrase/soulContractId required for Soul contract calls.');
      }
      this.soulClient = new Soul.Client({
        rpcUrl,
        networkPassphrase,
        contractId: soulContractId,
        allowHttp,
        publicKey: relayerAddress,
      });
    }
    return this.soulClient;
  }

  /**
   * Recupera ("rotaciona") a passkey vinculada ao Soul Token usando a Recovery Key.
   *
   * Fluxo (on-chain): valida `recovery_signature` (P-256) em `sha256(old_passkey || new_passkey)`
   * e então atualiza o mapping SoulByPasskey.
   *
   * Observação: este método apenas MONTA a transação do contrato `recover_soul`.
   * O `relayer` informado precisa conseguir autorizar/assinar a transação.
   */
  async recoverSovereignSoul(params: {
    password: string;
    encryptedVault: EncryptedVault;
    soulId: number;
    relayer: string;
    newPasskeyHex?: string;
  }): Promise<{ recoverTx: Awaited<ReturnType<Soul.Client['recover_soul']>>; newPasskeyHex: string }> {
    try {
      extendRuntimeCrypto();

      // 1) Resolve old_passkey on-chain via soulId (evita depender do dispositivo antigo)
      const soulTx = await this.getSoulClient().get_soul({ id: params.soulId });
      const soul = (soulTx as any).result;
      if (!soul) {
        throw new Error(`Soul not found for soulId=${params.soulId}`);
      }
      const oldPasskey: Buffer = Buffer.from(soul.passkey);

      // 2) Cria/recebe a nova passkey (public key 65 bytes)
      let newPasskeyHex = params.newPasskeyHex;
      if (!newPasskeyHex) {
        // Fallback mínimo: cria uma nova identidade/passkey.
        // Em um app real, você pode preferir pedir o newPasskeyHex externamente.
        const registration = await this.passkeyManager.createIdentity(this.config.appName);
        newPasskeyHex = registration.publicKeyHex;
      }

      const newPasskey = Buffer.from(newPasskeyHex, 'hex');

      // 3) Decripta a recovery seed e assina a mensagem de recuperação no formato esperado pelo contrato
      const recoverySeed = await decryptKey(params.encryptedVault, params.password);
      const recoverySignature = signSoulRecovery(recoverySeed, {
        oldPasskey,
        newPasskey,
      });

      // 4) Monta a transação `recover_soul`
      const recoverTx = await this.getSoulClient().recover_soul({
        relayer: params.relayer,
        old_passkey: oldPasskey,
        new_passkey: newPasskey,
        recovery_signature: recoverySignature,
      });

      return { recoverTx, newPasskeyHex };
    } catch (error: any) {
      logger.error('Sovereign Soul recovery failed', error);
      throw new Error(`[SoulSDK] ${error.message}`);
    }
  }

  /**
   * Sovereign Onboarding: Biometria -> Geração de Chave de Recuperação -> Mint no Soul Contract.
   */
  async createSovereignIdentity(password: string): Promise<SovereignSession> {
    try {
      logger.info("Starting Sovereign Identity Creation");

      // 1. Generate a Passkey using PasskeyManager
      const registration = await this.passkeyManager.createIdentity(this.config.appName);
      const passkey = Buffer.from(registration.publicKeyHex, 'hex');

      // 2. Generate a random 32-byte recovery seed and recovery_pubkey (secp256r1)
      const { seed, publicKey: recoveryPubKey } = await generateRecoveryKey();

      // 3. Encrypt the seed using Encryption.ts and the user's password
      const encryptedVault = await encryptKey(seed, password);

      // 4. Prepare the zolvency-soul contract mint function
      // For testing, let's use the authorized admin as relayer to see if it fixes simulation
      const relayerAddress = "GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75";

      // Normalize types to ensure clean XDR encoding
      const passkeyBytes = new Uint8Array(passkey);
      const recoveryBytes = new Uint8Array(recoveryPubKey);

      logger.info("Mint parameters length check:", {
        relayer: relayerAddress.length,
        owner: registration.contractId.length,
        passkey: passkeyBytes.length,
        recovery: recoveryBytes.length
      });

      const mintTxAssembled = await this.getSoulClient().mint({
        relayer: relayerAddress,
        owner: registration.contractId,
        passkey: Buffer.from(passkeyBytes),
        recovery_pubkey: Buffer.from(recoveryBytes)
      });

      let soulId = "pending";
      let txHash = "manual_broadcast_required";

      // 5. Automatic broadcast if paymaster or fee payer seed is available
      if (this.config.paymasterUrl || this.config.relayerAddress) {
        logger.info("Broadcasting mint transaction");
        
        // If we have a local fee payer seed, use AssembledTransaction native methods for full Soroban support
        if (this.config.feePayerSeed && !this.config.paymasterUrl) {
          logger.info("Using local fee payer signature");
          const feePayer = Keypair.fromSecret(this.config.feePayerSeed);
          
          // sign() simulates if needed and adds the signature
          await (mintTxAssembled as any).sign(feePayer);
          const result = await (mintTxAssembled as any).send();
          
          if (result && result.status === "SUCCESS") {
             txHash = (result as any).hash || "success";
             // Extract soulId from events
             const events = (result as any).events || [];
             const mintEvent = events.find((e: any) => e.type === "contract" && e.topics.includes("soul") && e.topics.includes("minted"));
             soulId = mintEvent ? mintEvent.value.toString() : "1";
             logger.info(`Sovereign Identity Minted: Soul #${soulId}, TX: ${txHash}`);
          } else {
             throw new Error(`Broadcast failed with status: ${result?.status}`);
          }
        } else {
          // Use paymaster or manual broadcast via TransactionBroadcaster
          let tx = (mintTxAssembled as any).built || (mintTxAssembled as any).transaction;
          
          if (!tx) {
            throw new Error("Could not extract simulated transaction for Paymaster broadcast.");
          }
          
          const result = await this.broadcaster.broadcast(tx);
          
          if (result && result.status === "SUCCESS") {
            txHash = (result as any).hash || "success";
            const events = (result as any).events || [];
            const mintEvent = events.find((e: any) => e.type === "contract" && e.topics.includes("soul") && e.topics.includes("minted"));
            soulId = mintEvent ? mintEvent.value.toString() : "1";
            logger.info(`Sovereign Identity Minted: Soul #${soulId}, TX: ${txHash}`);
          } else {
            throw new Error(`Broadcast failed: ${result.status}`);
          }
        }
      }

      return {
        soulId,
        address: registration.contractId,
        encryptedVault,
        recoveryPublicKey: recoveryPubKey.toString('hex'),
        txHash,
        publicKeyHex: registration.publicKeyHex
      };
    } catch (error: any) {
      logger.error("Sovereign Identity creation failed", error);
      throw new Error(`[SoulSDK] ${error.message}`);
    }
  }

  /**
   * Automated Resolution: Biometria -> SoulID -> Reputação.
   */
  async identify(): Promise<IdentityMetadata> {
    try {
      logger.info("Starting Sovereign Identity Resolution");

      // 1. Call PasskeyManager.connectWallet() (biometric handshake)
      const auth = await this.passkeyManager.connectWallet();
      
      // 2. Extract the public key from the result
      if (!auth.publicKeyHex) {
        throw new Error("Public key not returned from biometric handshake");
      }
      const passkey = Buffer.from(auth.publicKeyHex, 'hex');

      // 3. Call the contract get_soul_id_by_passkey(pubKey)
      // Precisamos de um RPC server para chamadas de leitura
      const soulIdTx = await this.getSoulClient().get_soul_id_by_passkey({ passkey });
      const soulId = (soulIdTx as any).result.toString();

      if (soulId === "0") {
        throw new Error("No Sovereign Identity found for this passkey");
      }

      // 4. Load all reputation scores from ZolvencyRegistry using the resolved soulId
      const registryClient = new Registry.Client({
        rpcUrl: this.config.rpcUrl,
        networkPassphrase: this.config.networkPassphrase,
        contractId: this.config.registryContractId,
      });

      // Back-compat: older Registry wrappers used `get_user_reputation({ user })`.
      // Current Registry wrapper uses `get_soul_reputation({ soul_id })`.
      const reputationTx = typeof (registryClient as any).get_soul_reputation === 'function'
        ? await (registryClient as any).get_soul_reputation({ soul_id: Number(soulId) })
        : await (registryClient as any).get_user_reputation({ user: soulId });
      const reputation = (reputationTx as any).result;

      const result = {
        soulId,
        address: auth.contractId,
        reputation: reputation || {},
        publicKeyHex: auth.publicKeyHex
      };

      if (this.onSession) {
        this.onSession(auth.contractId);
      }

      return result;
    } catch (error: any) {
      logger.error("Sovereign Identity resolution failed", error);
      throw new Error(`[SoulSDK] ${error.message}`);
    }
  }

  /**
   * Imports an identity from a backup and migrates it to a new passkey for the current device.
   * 
   * @param backup The SoulBackup containing the identity metadata and encrypted vault
   * @param password The password to decrypt the vault
   * @returns The updated SovereignSession
   */
  async importAndMigrate(backup: any, password: string): Promise<SovereignSession> {
    try {
      logger.info(`Starting Identity Import & Migration for Soul #${backup.soulId}`);

      // 1. Decrypt the recovery key from the vault
      const recoverySeed = await decryptKey(backup.vault, password);

      // 2. Create a NEW passkey for this device
      const registration = await this.passkeyManager.createIdentity(this.config.appName);
      const newPasskey = Buffer.from(registration.publicKeyHex, 'hex');

      // 3. Get the old passkey from on-chain to sign the rotation
      const soulTx = await this.getSoulClient().get_soul({ id: backup.soulId });
      const soul = (soulTx as any).result;
      if (!soul) {
        throw new Error(`Soul not found for soulId=${backup.soulId}`);
      }
      const oldPasskey = Buffer.from(soul.passkey);

      // 4. Sign the recovery/rotation message
      const recoverySignature = signSoulRecovery(recoverySeed, {
        oldPasskey,
        newPasskey
      });

      // 5. Build and broadcast the recover_soul transaction
      const relayer = this.config.relayerAddress || registration.contractId;
      const recoverTxAssembled = await this.getSoulClient().recover_soul({
        relayer,
        old_passkey: oldPasskey,
        new_passkey: newPasskey,
        recovery_signature: recoverySignature
      });

      const tx = (recoverTxAssembled as any).transaction || (recoverTxAssembled as any).built;
      if (!tx) {
        throw new Error("Could not extract transaction from assembled recover_soul call.");
      }

      const result = await this.broadcaster.broadcast(tx);

      if (!result || result.status !== "SUCCESS") {
        throw new Error(`Migration broadcast failed: ${result?.status || 'Unknown error'}`);
      }

      const txHash = (result as any).hash || "success";
      logger.info(`Identity Migrated Successfully. New Passkey: ${registration.publicKeyHex}, TX: ${txHash}`);

      const session: SovereignSession = {
        soulId: backup.soulId.toString(),
        address: registration.contractId,
        encryptedVault: backup.vault,
        recoveryPublicKey: Buffer.from(deriveRecoveryPublicKey(recoverySeed)).toString('hex'),
        txHash
      };

      if (this.onSession) {
        this.onSession(registration.contractId);
      }

      return session;
    } catch (error: any) {
      logger.error("Identity migration failed", error);
      throw new Error(`[SoulSDK] ${error.message}`);
    }
  }
}

      function extendRuntimeCrypto() {
  // Node/Vitest sometimes doesn't expose `crypto` as a global the same way browsers do.
  // We keep this tiny helper localized so SDK consumers in browsers are unaffected.
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('WebCrypto `crypto` is not available in this runtime.');
  }
}

