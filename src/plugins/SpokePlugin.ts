import { rpc } from "@stellar/stellar-sdk";

export interface PluginContext {
  networkPassphrase?: string;
  rpcUrl?: string;
  hubAddress?: string;
}

/**
 * Interface para estender o SDK com novos tipos de SBTs (ex: TaxSBT, MachineHealthSBT).
 */
export interface SpokePlugin {
  name: string;
  contractId: string;
  initialize(rpc: rpc.Server, context?: PluginContext): void;
}
