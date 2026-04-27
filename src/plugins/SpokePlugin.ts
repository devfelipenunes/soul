import { SorobanRpc } from "@stellar/stellar-sdk";

/**
 * Interface para estender o SDK com novos tipos de SBTs (ex: TaxSBT, MachineHealthSBT).
 */
export interface SpokePlugin {
  name: string;
  contractId: string;
  initialize(rpc: SorobanRpc.Server): void;
}
