import { IdentityProfile } from "../../identity/SovereignProfile";

export interface DepositInstructions {
  type: "pix";
  qrCode: string;
  pixKey: string;
  transactionId: string;
  eta?: number;
}

export interface IAnchorProvider {
  getDepositInstructions(amount: number, profile: IdentityProfile): Promise<DepositInstructions>;
  getTransactionStatus(id: string): Promise<"pending" | "completed" | "failed">;
  getAssetCode(): string;
  getIssuerAddress(): string;
}
