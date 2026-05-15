export interface IdentityProfile {
  fullName: string;
  taxId: string; // CPF for Brazil
  email?: string;
  address?: string;
  preferredCurrency: "BRL" | "USD";
}
