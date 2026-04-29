import { rpc } from "@stellar/stellar-sdk";
import { SpokePlugin, PluginContext } from "./SpokePlugin";

export abstract class BaseSourcePlugin implements SpokePlugin {
  abstract name: string;
  abstract contractId: string;
  protected rpc: rpc.Server | null = null;
  protected context: PluginContext | null = null;

  initialize(rpc: rpc.Server, context?: PluginContext): void {
    this.rpc = rpc;
    this.context = context || null;
  }

  /**
   * Fetches detailed token data for a specific tokenId.
   * Assumes the contract implements a get_token_data(token_id: u64) method.
   */
  async getTokenData(tokenContractId: string, tokenId: string | number | bigint): Promise<any> {
    if (!this.rpc) throw new Error(`Plugin ${this.name} not initialized`);

    try {
      // Create a contract instance or use invoke_contract simulation
      // For simplicity in the base class, we use simulation via rpc
      // in a real implementation, we could generate a Client for each plugin
      
      // This is a generic way to call a contract without having the full generated client
      // though using the generated client is preferred if available.
      return await this.fetchViaSimulation(tokenContractId, "get_token_data", [BigInt(tokenId)]);
    } catch (error: any) {
      console.error(`[Plugin:${this.name}] Error fetching token data:`, error.message);
      return null;
    }
  }

  protected async fetchViaSimulation(contractId: string, method: string, args: any[]): Promise<any> {
    // TODO: Implement a generic simulation path once the contract spec is available.
    // The base plugin cannot safely invoke without a contract spec to encode args.
    throw new Error(
      `Plugin ${this.name} does not implement fetchViaSimulation for ${method}. ` +
      `Provide a specialized client in the plugin instead.`
    );
  }
}
