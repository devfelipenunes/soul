import { rpc, TransactionBuilder, Asset, Operation, Account, Transaction, Keypair, Contract, Address, scValToNative, Networks } from "@stellar/stellar-sdk";
import { IAnchorProvider, DepositInstructions } from "../plugins/anchors/IAnchorProvider";
import { IdentityProfile } from "../identity/SovereignProfile";
import { TransactionBroadcaster } from "../tx/Broadcaster";
import { logger } from "../utils/Logger";

export class FundingService {
  constructor(
    private provider: IAnchorProvider,
    private broadcaster: TransactionBroadcaster,
    private rpcServer: rpc.Server,
    private networkPassphrase: string
  ) {}
  
  async requestPixDeposit(amount: number, profile: IdentityProfile): Promise<DepositInstructions> {
    return this.provider.getDepositInstructions(amount, profile);
  }

  async pollDepositStatus(transactionId: string, intervalMs = 5000): Promise<boolean> {
    logger.info(`Polling deposit status for ${transactionId}...`);
    while (true) {
      const status = await this.provider.getTransactionStatus(transactionId);
      if (status === "completed") {
        logger.info(`Deposit ${transactionId} completed!`);
        return true;
      }
      if (status === "failed") {
        logger.error(`Deposit ${transactionId} failed!`);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * Checks the balance.
   * For Smart Wallets, it also checks for account existence (Friendbot funding).
   */
  async checkBalance(address: string): Promise<bigint> {
    const assetCode = this.provider.getAssetCode();
    const issuer = this.provider.getIssuerAddress();
    
    logger.debug(`Checking balance for ${assetCode} on ${address}`);

    try {
      if (address.startsWith("C")) {
        try {
          // Dynamically resolve Native Token Contract for Testnet
          const nativeTokenId = Asset.native().contractId(Networks.TESTNET);
          const nativeContract = new Contract(nativeTokenId);
          
          // Dummy relayer for simulation
          const relayer = Keypair.fromSecret("SCLMARUQYABVBJ3O7K57FVSDVBTZ6OD4W6KTIGQKNXX3DUH4DUK7UMBO");
          
          const txBal = new TransactionBuilder(await this.rpcServer.getAccount(relayer.publicKey()), {
            fee: "1000",
            networkPassphrase: Networks.TESTNET,
          })
          .addOperation(nativeContract.call("balance", new Address(address).toScVal()))
          .setTimeout(30)
          .build();
 
          const simBal = await this.rpcServer.simulateTransaction(txBal);
          if (rpc.Api.isSimulationSuccess(simBal)) {
            const bal = scValToNative(simBal.result!.retval);
            if (bal > 0n) {
                logger.info(`✅ Smart Wallet Native Balance: ${Number(bal) / 1e7} XLM`);
                return bal;
            }
          }
        } catch (e) {
          logger.warn(`Failed to read native balance via contract: ${e}`);
        }
        return BigInt(0);
      }

      // Classic G... address check
      const accountResponse = await this.rpcServer.getAccount(address) as any;
      const balances = accountResponse.balances || [];
      const balanceObj = balances.find(
        (b: any) => b.asset_code === assetCode && b.asset_issuer === issuer
      );
      
      if (!balanceObj) return 0n;
      return BigInt(Math.floor(parseFloat(balanceObj.balance)));
    } catch (e) {
      logger.error(`Failed to fetch balance for ${address}: ${e}`);
      return 0n;
    }
  }

  async ensureTrustline(address: string): Promise<string | null> {
    if (address.startsWith("C")) {
      logger.info(`Address ${address} is a Smart Wallet. Skipping classic trustline check.`);
      return null;
    }

    const assetCode = this.provider.getAssetCode();
    const issuer = this.provider.getIssuerAddress();
    const asset = new Asset(assetCode, issuer);

    logger.info(`Checking trustline for ${assetCode} on ${address}`);

    try {
      const accountResponse = await this.rpcServer.getAccount(address) as any;
      const hasTrustline = (accountResponse.balances || []).some(
        (b: any) => b.asset_code === assetCode && b.asset_issuer === issuer
      );

      if (hasTrustline) {
        logger.info(`Trustline for ${assetCode} already exists.`);
        return null;
      }

      logger.info(`Trustline for ${assetCode} missing. Creating...`);

      const tx = new TransactionBuilder(new Account(address, accountResponse.sequence), {
        fee: "1000",
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.changeTrust({
            asset,
          })
        )
        .setTimeout(60)
        .build();

      const response = await this.broadcaster.broadcast(tx as Transaction) as any;
      
      if (response.status !== "SUCCESS") {
        throw new Error(`Failed to create trustline: ${response.status}`);
      }

      return response.hash || response.txHash;
    } catch (error) {
      logger.error("Error in ensureTrustline", error);
      throw error;
    }
  }

  getProvider(): IAnchorProvider {
    return this.provider;
  }
}
