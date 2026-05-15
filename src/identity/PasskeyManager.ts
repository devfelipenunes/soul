import { PasskeyKit, PasskeyClient } from 'passkey-kit';
import { Buffer } from 'buffer';
import { hash, Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { logger } from '../utils/Logger';


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
  feePayerSeed?: string;
}


export interface RegistrationResult {
  contractId: string;
  keyIdBase64: string;
  publicKeyHex: string;
  signedTxXdr: string;
}

export interface AuthResult {
  contractId: string;
  keyIdBase64: string;
  publicKeyHex?: string;
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
   * Registra uma nova identidade biométrica e prepara o deploy da Smart Wallet.
   */
  async createIdentity(appName: string, forceMobile = false): Promise<RegistrationResult> {
    const displayName = `Zolvency ID (${new Date().toLocaleDateString()})`;
    const userName = `user_${Math.random().toString(36).substring(2, 10)}`;

    const hostname = window.location.hostname;
    const rpId = (hostname === '127.0.0.1' || hostname === 'localhost') ? undefined : hostname;

    // IMPORTANTE: WebAuthn EXIGE ArrayBuffer para challenge e user.id
    // Passar string causava o erro ".replace of undefined" interno do browser/polyfill
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: { name: appName, id: rpId },
      user: {
        id: userId,
        name: userName,
        displayName: displayName,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        residentKey: "preferred",
        requireResidentKey: false,
        userVerification: "preferred",
        authenticatorAttachment: forceMobile ? "cross-platform" : undefined,
      },
      timeout: 60000,
      attestation: "none",
    };

    logger.debug("Calling navigator.credentials.create...");
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
    
    // Normalização da chave Secp256r1 para 65 bytes (0x04 + X + Y)
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

    const seed = this.config.feePayerSeed || 'kalepail';
    const walletKeypair = Keypair.fromRawEd25519Seed(hash(Buffer.from(seed)));

    
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

    const contractId = (at as any).result.options.contractId as string;
    const xdrBase64 = (at as any).toXDR('base64') as string;
    const builtTx = TransactionBuilder.fromXDR(xdrBase64, this.config.networkPassphrase);
    (builtTx as any).sign(walletKeypair);


    return {
      contractId,
      keyIdBase64: Base64URL.encode(keyId),
      publicKeyHex: Buffer.from(pubKey).toString('hex'),
      signedTxXdr: (builtTx as any).toXDR('base64'),
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
