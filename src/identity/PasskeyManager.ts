import { PasskeyKit, PasskeyClient } from 'passkey-kit';
import { Buffer } from 'buffer';
import { hash, Keypair, TransactionBuilder } from '@stellar/stellar-sdk';

/**
 * Utilitário nativo para Base64URL para comunicação com o Relayer
 */
const Base64URL = {
  encode: (buffer: Uint8Array): string => {
    const binString = Array.from(buffer, (byte) => String.fromCharCode(byte)).join("");
    return window.btoa(binString)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  },
  decode: (str: string): Uint8Array => {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const binString = window.atob(base64);
    return Uint8Array.from(binString, (m) => m.charCodeAt(0));
  }
};

export interface PasskeyConfig {
  rpcUrl: string;
  networkPassphrase: string;
  walletWasmHash: string;
}

export interface RegistrationResult {
  contractId: string;
  keyIdBase64: string;
  publicKeyHex: string;
  signedTxXdr: string;
  encryptedVault: string;
  soulId: string;
}

export interface AuthResult {
  contractId: string;
  keyIdBase64: string;
}

export class PasskeyManager {
  private kit: PasskeyKit;
  private config: PasskeyConfig;

  constructor(config: PasskeyConfig) {
    this.config = config;
    this.kit = new PasskeyKit({
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      walletWasmHash: config.walletWasmHash,
    });
  }

  /**
   * Criptografa dados sensíveis usando a senha do usuário e AES-GCM.
   */
  private async encryptVault(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const pwHash = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    
    const key = await crypto.subtle.importKey(
      'raw',
      pwHash,
      'AES-GCM',
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    const vault = {
      version: "1",
      iv: Buffer.from(iv).toString('base64'),
      ciphertext: Buffer.from(new Uint8Array(encrypted)).toString('base64'),
      timestamp: Date.now()
    };

    return JSON.stringify(vault);
  }

  /**
   * Registra uma nova identidade biométrica soberana.
   * O identificador (SoulID) é derivado automaticamente.
   */
  async createIdentity(appName: string, password?: string, forceMobile = false): Promise<RegistrationResult> {
    if (!password || password.length < 8) {
      throw new Error("Uma senha de segurança é obrigatória para proteger seu Vault Soberano.");
    }

    const now = new Date();
    const hostname = window.location.hostname;
    const rpId = (hostname === '127.0.0.1' || hostname === 'localhost') ? undefined : hostname;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    // O userName agora é um placeholder interno ou derivado
    const internalLabel = `Zolvency Sovereign Identity (${now.toLocaleDateString()})`;

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: { name: appName, id: rpId },
      user: {
        id: userId,
        name: "sovereign_agent",
        displayName: internalLabel,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
        authenticatorAttachment: forceMobile ? "cross-platform" : undefined,
      },
      timeout: 60000,
      attestation: "none",
    };

    console.log("[Zolvency SDK] Solicitando assinatura biométrica soberana...");
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) throw new Error("Falha ao criar credencial biométrica.");

    const response = credential.response as AuthenticatorAttestationResponse;
    const rawPublicKey = response.getPublicKey ? response.getPublicKey() : null;
    
    if (!rawPublicKey) {
      throw new Error("O hardware não retornou a chave pública.");
    }

    const keyId = new Uint8Array(credential.rawId);
    let pubKey = new Uint8Array(rawPublicKey);
    
    // Normalização Secp256r1
    if (pubKey.length > 65) {
      pubKey = pubKey.slice(pubKey.length - 65);
    }
    if (pubKey.length === 64) {
      const fixedKey = new Uint8Array(65);
      fixedKey[0] = 0x04;
      fixedKey.set(pubKey, 1);
      pubKey = fixedKey;
    }

    const keyIdBuffer = Buffer.from(keyId);
    const salt = hash(keyIdBuffer); 

    const walletKeypair = Keypair.fromRawEd25519Seed(hash(Buffer.from('kalepail')));
    
    const at = await PasskeyClient.deploy(
      {
        signer: {
          tag: 'Secp256r1',
          values: [
            keyIdBuffer,
            Buffer.from(pubKey),
            [undefined],
            [undefined],
            { tag: 'Persistent', values: undefined },
          ]
        }
      },
      {
        rpcUrl: this.config.rpcUrl,
        wasmHash: this.config.walletWasmHash,
        networkPassphrase: this.config.networkPassphrase,
        publicKey: walletKeypair.publicKey(),
        salt: salt,
      }
    );

    const contractId = (at as any).result.options.contractId;
    const xdrBase64 = (at as any).toXDR('base64');
    const builtTx = (TransactionBuilder as any).fromXDR(xdrBase64, this.config.networkPassphrase);
    (builtTx as any).sign(walletKeypair);

    // SoulID Profissional: Prefixo SOUL + Hash curto do ContractID
    const soulId = `SOUL-${contractId.slice(1, 9).toUpperCase()}`;

    // Vault Soberano
    const vaultData = JSON.stringify({
      soulId,
      keyId: Base64URL.encode(keyId),
      contractId,
      publicKey: Buffer.from(pubKey).toString('hex'),
      createdAt: now.toISOString()
    });
    const encryptedVault = await this.encryptVault(vaultData, password);

    return {
      contractId,
      soulId,
      keyIdBase64: Base64URL.encode(keyId),
      publicKeyHex: Buffer.from(pubKey).toString('hex'),
      signedTxXdr: (builtTx as any).toXDR('base64'),
      encryptedVault,
    };
  }

  async connectWallet(keyId?: string): Promise<AuthResult> {
    const hostname = window.location.hostname;
    const rpId = (hostname === '127.0.0.1' || hostname === 'localhost') ? undefined : hostname;
    
    return await this.kit.connectWallet({
      rpId: rpId,
      keyId: keyId
    });
  }

  async sign(txXdr: string, keyId?: string): Promise<string> {
    const hostname = window.location.hostname;
    const rpId = (hostname === '127.0.0.1' || hostname === 'localhost') ? undefined : hostname;

    const signedTx = await this.kit.sign(txXdr, {
      rpId: rpId,
      keyId: keyId as any
    });
    
    return (signedTx as any).toXDR('base64');
  }
}
