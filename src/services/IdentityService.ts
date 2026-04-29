import { PasskeyManager, RegistrationResult } from '../identity/PasskeyManager';

export interface IdentityConfig {
  relayerUrl: string;
  soulContractId: string;
  appName: string;
}

export interface ZolvencySession {
  address: string;
  keyId: string;
  soulId?: string;
  username: string;
  txHash?: string;
}

export class IdentityService {
  private passkeyManager: PasskeyManager;
  private config: IdentityConfig;

  constructor(passkeyManager: PasskeyManager, config: IdentityConfig) {
    this.passkeyManager = passkeyManager;
    this.config = config;
  }

  /**
   * O "Caminho das Uvas": Onboarding Atômico em um clique.
   */
  async connect(username: string, forceMobile = false): Promise<ZolvencySession> {
    try {
      // 1. Biometria
      const identity = await this.passkeyManager.createIdentity(
        this.config.appName, 
        username, 
        forceMobile
      );

      // 2. Deploy da Smart Wallet via Relayer
      const deployRes = await fetch(`${this.config.relayerUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txXdr: identity.signedTxXdr }),
      });
      const deployData = await deployRes.json();
      if (!deployData.success) throw new Error(deployData.error || 'Falha no deploy da wallet');

      // 3. Mint da Soul via Relayer
      const mintRes = await fetch(`${this.config.relayerUrl}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          walletContractId: identity.contractId,
          publicKeyHex: identity.publicKeyHex,
        }),
      });
      const mintData = await mintRes.json();
      if (!mintData.success) throw new Error(mintData.error || 'Falha no mint da Soul');

      return {
        address: identity.contractId,
        keyId: identity.keyIdBase64,
        soulId: mintData.tokenId?.toString(),
        username,
        txHash: deployData.hash
      };
    } catch (error: any) {
      throw new Error(`[Zolvency Identity] ${error.message}`);
    }
  }

  /**
   * Minta apenas o Soul Token para uma carteira já existente.
   */
  async mintSoul(username: string, walletContractId: string, publicKeyHex: string): Promise<string> {
    try {
      const mintRes = await fetch(`${this.config.relayerUrl}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          walletContractId,
          publicKeyHex,
        }),
      });
      const mintData = await mintRes.json();
      if (!mintData.success) throw new Error(mintData.error || 'Falha no mint da Soul');
      return mintData.tokenId?.toString();
    } catch (error: any) {
      throw new Error(`[Zolvency Identity] ${error.message}`);
    }
  }

  /**
   * Verifica se o endereço possui uma Soul verificada.
   */
  async isHuman(address: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.relayerUrl}/check-soul?address=${address}`);
      const data = await res.json();
      return !!data.hasSoul;
    } catch {
      return false;
    }
  }
}
