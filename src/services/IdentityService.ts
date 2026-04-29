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
  private onSession?: (address: string) => void;

  constructor(passkeyManager: PasskeyManager, config: IdentityConfig, onSession?: (address: string) => void) {
    this.passkeyManager = passkeyManager;
    this.config = config;
    this.onSession = onSession;
  }

  private joinUrl(base: string, path: string): string {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  /**
   * Onboarding Atômico: Biometria -> Deploy -> Mint.
   */
  async connect(username: string, forceMobile = false): Promise<ZolvencySession> {
    try {
      console.log(`[Zolvency SDK] 1. Iniciando Biometria para: ${username}`);
      const identity = await this.passkeyManager.createIdentity(
        this.config.appName, 
        username, 
        forceMobile
      );

      const sendUrl = this.joinUrl(this.config.relayerUrl, 'send');
      console.log(`[Zolvency SDK] 2. Enviando TX de Deploy para: ${sendUrl}`);

      // Chamada de Rede (Relayer /send)
      const deployRes = await fetch(sendUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ txXdr: identity.signedTxXdr }),
      });
      
      if (!deployRes.ok) {
        const errorText = await deployRes.text();
        console.error(`[Zolvency SDK] Falha no Relayer /send: ${deployRes.status}`, errorText);
        throw new Error(`Erro no Relayer (/send): ${deployRes.status} ${errorText}`);
      }

      const deployData = await deployRes.json();
      console.log(`[Zolvency SDK] 3. Wallet Deployada: ${deployData.hash}`);

      const mintUrl = this.joinUrl(this.config.relayerUrl, 'mint');
      console.log(`[Zolvency SDK] 4. Solicitando Mint para: ${mintUrl}`);

      // Chamada de Rede (Relayer /mint)
      const mintRes = await fetch(mintUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username,
          walletContractId: identity.contractId,
          publicKeyHex: identity.publicKeyHex,
        }),
      });

      const mintData = await mintRes.json();
      const soulId = mintData.success ? mintData.tokenId?.toString() : undefined;
      
      if (soulId) {
        console.log(`[Zolvency SDK] 5. Soul Token Mintado: ${soulId}`);
      } else {
        console.warn("[Zolvency SDK] Mint não foi concluído automaticamente.");
      }

      if (this.onSession) {
        this.onSession(identity.contractId);
      }

      return {
        address: identity.contractId,
        keyId: identity.keyIdBase64,
        soulId,
        username,
        txHash: deployData.hash
      };
    } catch (error: any) {
      console.error("[Zolvency SDK Network Error]:", error);
      // Se o erro for "Failed to fetch", provavelmente é rede ou CORS
      if (error.message === "Failed to fetch") {
        throw new Error(`Erro de Conexão: Não foi possível alcançar o Relayer em "${this.config.relayerUrl}". Verifique se o seu frontend está rodando e o Proxy do Vite está correto.`);
      }
      throw new Error(`[Zolvency Identity] ${error.message}`);
    }
  }

  async login(keyId?: string): Promise<AuthResult> {
    try {
      const result = await this.passkeyManager.connectWallet(keyId);
      if (this.onSession) this.onSession(result.contractId);
      return result;
    } catch (error: any) {
      throw new Error(`[Zolvency Identity] Login falhou: ${error.message}`);
    }
  }

  async signTransaction(txXdr: string, keyId?: string): Promise<string> {
    try {
      return await this.passkeyManager.sign(txXdr, keyId);
    } catch (error: any) {
      throw new Error(`[Zolvency Identity] Assinatura falhou: ${error.message}`);
    }
  }

  async mintSoul(username: string, address: string, publicKey: string): Promise<string | undefined> {
    try {
      const mintUrl = this.joinUrl(this.config.relayerUrl, 'mint');
      const mintRes = await fetch(mintUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          walletContractId: address,
          publicKeyHex: publicKey,
        }),
      });
      const mintData = await mintRes.json();
      return mintData.tokenId?.toString();
    } catch (error: any) {
      throw new Error(`[Zolvency Identity] ${error.message}`);
    }
  }

  async isHuman(address: string): Promise<boolean> {
    try {
      const checkUrl = this.joinUrl(this.config.relayerUrl, `check-soul?address=${address}`);
      const res = await fetch(checkUrl);
      const data = await res.json();
      return !!data.hasSoul;
    } catch {
      return false;
    }
  }
}

export interface AuthResult {
  contractId: string;
  keyIdBase64: string;
}
