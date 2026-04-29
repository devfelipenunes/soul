import { rpc } from "@stellar/stellar-sdk";
import { BaseSourcePlugin } from "./BaseSourcePlugin";
import * as Identity from "../contracts/identity";
import { PluginContext } from "./SpokePlugin";

export class GitHubSourcePlugin extends BaseSourcePlugin {
  public readonly name = "github";
  private client: Identity.Client | null = null;

  constructor(public readonly contractId: string) {
    super();
  }

  initialize(rpc: rpc.Server, context?: PluginContext): void {
    super.initialize(rpc, context);
    // Initialize the specialized contract client
    this.client = new Identity.Client({
      rpcUrl: rpc.serverURL.toString(),
      // The passphrase isn't strictly needed for read-only simulations but good for consistency
      networkPassphrase: context?.networkPassphrase || "Test SDF Network ; September 2015",
      contractId: this.contractId,
    });
  }

  /**
   * Fetches full GitHub identity data from the contract.
   */
  async getDetails(tokenId: string | number | bigint) {
    if (!this.client) return null;
    
    try {
      const tx = await this.client.get_token_data({ token_id: BigInt(tokenId) });
      if (tx.result.isOk()) {
        const data = tx.result.unwrap();
        return {
          username: data.username,
          contributions: data.contributions,
          tier: (data.tier as any).tag, // Extract enum tag
          mintedAt: new Date(Number(data.minted_at) * 1000),
          updatedAt: new Date(Number(data.updated_at) * 1000),
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
