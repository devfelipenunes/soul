import { PasskeyKit } from 'passkey-kit';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

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
}

export class PasskeyManager {
  private kit: PasskeyKit;

  constructor(config: PasskeyConfig) {
    this.kit = new PasskeyKit({
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      walletWasmHash: config.walletWasmHash,
      WebAuthn: {
        startRegistration,
        startAuthentication,
      },
    });
  }

  /**
   * Registra uma nova identidade biométrica e prepara o deploy da Smart Wallet.
   */
  async createIdentity(appName: string, userName: string, forceMobile = false): Promise<RegistrationResult> {
    const settings: any = {
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    };

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        settings.rpId = hostname;
      }
    }

    if (forceMobile) {
      settings.authenticatorSelection.authenticatorAttachment = 'cross-platform';
    }

    const result = await this.kit.createWallet(appName, userName, settings);

    // Extrair chave pública como Hex
    let publicKeyHex = '';
    const keyResult = result.rawResponse;
    if (keyResult?.response?.publicKey) {
      const pubKeyArray = new Uint8Array(keyResult.response.publicKey);
      publicKeyHex = Array.from(pubKeyArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    return {
      contractId: result.contractId,
      keyIdBase64: result.keyIdBase64,
      publicKeyHex,
      signedTxXdr: result.signedTx.toXDR('base64'),
    };
  }

  /**
   * Conecta a uma Smart Wallet existente via biometria.
   */
  async connectWallet(keyId?: string) {
    const opts: any = {};
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        opts.rpId = hostname;
      }
    }
    if (keyId) opts.keyId = keyId;

    return await this.kit.connectWallet(opts);
  }

  /**
   * Assina uma transação com biometria.
   */
  async sign(txXdr: string, keyId?: string) {
    const opts: any = {};
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        opts.rpId = hostname;
      }
    }
    if (keyId) opts.keyId = keyId;

    const signedTx = await this.kit.sign(txXdr, opts);
    return signedTx.toXDR('base64');
  }
}
