import { Asset, Keypair, TransactionBuilder, rpc, Networks, Contract, nativeToScVal } from "@stellar/stellar-sdk";
import { IAnchorProvider, DepositInstructions } from "./IAnchorProvider";
import { IdentityProfile } from "../../identity/SovereignProfile";
import { logger } from "../../utils/Logger";

export class BitsoProvider implements IAnchorProvider {
  private assetCode = "BRLT";
  private issuerAddress = "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
  // Relayer com fundos (GAK35...)
  private faucetSecret = "SCLMARUQYABVBJ3O7K57FVSDVBTZ6OD4W6KTIGQKNXX3DUH4DUK7UMBO";

  async getDepositInstructions(amount: number, profile: IdentityProfile): Promise<DepositInstructions> {
    logger.info(`Generating PIX deposit for ${amount} BRLT for ${profile.fullName || profile.taxId}`);
    
    const transactionId = `tx_${Math.random().toString(36).substring(7)}`;
    
    // REAL SOROBAN FAUCET: Envia XLM Nativo via contrato (compatível com C...)
    if (profile.address) {
      this.triggerNativeFaucet(profile.address).catch(e => {
        logger.error(`[FAUCET] Failed: ${e}`);
        // Fallback for DEV: Se o faucet falhar, emitimos um evento para unblock o UI
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('zolvency-simulate-payment'));
        }
      });
    }

    return {
      qrCode: `00020126580014br.gov.bcb.pix0136bitsopix@bitso.com5204000053039865405${amount}.005802BR5913BITSO%20BRASIL6009SAO%20PAULO62070503***6304${Math.floor(Math.random()*9000)+1000}`,
      pixKey: "bitso-pix-key@bitso.com",
      transactionId
    };
  }

  async getTransactionStatus(transactionId: string): Promise<"pending" | "completed" | "failed"> {
    return "completed"; 
  }

  getAssetCode(): string {
    return this.assetCode;
  }

  getIssuerAddress(): string {
    return this.issuerAddress;
  }

  /**
   * Envia XLM Nativo para o Contrato usando o Native Token Contract gerado dinamicamente
   */
  private async triggerNativeFaucet(to: string) {
    logger.info(`[FAUCET] Sending Native XLM to ${to}...`);
    try {
      const server = new rpc.Server("https://soroban-testnet.stellar.org");
      const faucetKey = Keypair.fromSecret(this.faucetSecret);
      const accountResponse = await server.getAccount(faucetKey.publicKey());
      
      // Geração DINÂMICA do Native Token Contract ID
      const nativeAsset = Asset.native();
      const nativeTokenContractId = nativeAsset.contractId(Networks.TESTNET);
      const tokenContract = new Contract(nativeTokenContractId);

      logger.info(`[FAUCET] Native Token Contract ID: ${nativeTokenContractId}`);

      const op = tokenContract.call("transfer", 
        nativeToScVal(faucetKey.publicKey(), { type: "address" }),
        nativeToScVal(to, { type: "address" }),
        nativeToScVal(BigInt(10) * BigInt(10**7), { type: "i128" })
      );

      const tx = new TransactionBuilder(accountResponse, {
        fee: "5000",
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(op)
      .setTimeout(60)
      .build();

      const simulation = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simulation)) throw new Error("Simulation failed");

      const assembledTx = rpc.assembleTransaction(tx, simulation).build();
      assembledTx.sign(faucetKey);

      const res = await server.sendTransaction(assembledTx);
      logger.info(`[FAUCET] Native XLM Sent! Hash: ${res.hash}`);
    } catch (e) {
      throw e; // Repassa para o catch do getDepositInstructions
    }
  }
}
