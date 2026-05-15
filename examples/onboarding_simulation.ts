import { SoulSDK, PRESETS } from "../src";
import { Keypair } from "@stellar/stellar-sdk";
import { vi } from "vitest"; // We use vitest's mocking power even in the script

/**
 * 🚀 Soul SDK - End-to-End Onboarding Simulation
 * 
 * This script simulates the full "Zero-Touch" user journey:
 * 1. Identity Creation (Biometric Handshake)
 * 2. PIX Funding (SEP-6 via Anchor)
 * 3. Deposit Confirmation & Trustline Setup
 * 4. Agent Mandate Issuance (Nexus)
 */

async function main() {
  console.log("\n🛸 SOUL SDK - AGENTIC ONBOARDING SIMULATION");
  console.log("===========================================\n");

  // --- CONFIGURATION ---
  const sdk = new SoulSDK({
    ...PRESETS.TESTNET,
    soulContractId: "CC...", // Placeholder
    registryContractId: "CC...", // Placeholder
    nexusContractId: "CC...", // Placeholder
    appName: "Zolvency Simulation",
    paymasterUrl: "http://paymaster.zolvency.ai", // Gasless Simulation
  });

  // --- MOCKS FOR NODE ENVIRONMENT ---
  // In a real browser, these use WebAuthn/Biometrics
  // Here we mock them to see the orchestration working
  
  const mockPublicKeyHex = Keypair.random().publicKey();
  const mockUserAddress = "GUSER" + Math.random().toString(36).substring(7).toUpperCase();

  // Mocking IdentityService methods
  (sdk as any).identity.identify = async () => ({
    soulId: "12345",
    address: mockUserAddress,
    publicKeyHex: "aabbccddeeff", // Mock passkey public key
    reputation: {}
  });

  // Mocking FundingService methods
  (sdk as any).funding.requestPixDeposit = async (amount: number, profile: any) => {
    console.log(`[Funding] Requesting R$ ${amount} PIX for ${profile.fullName}...`);
    return {
      type: "pix",
      qrCode: "00020126360014BR.GOV.BCB.PIX0114+55119999999995204000053039865405100.005802BR5913Zolvency Demo6009Sao Paulo62070503***6304E22A",
      pixKey: "pix@zolvency.ai",
      transactionId: "tx_sim_98765"
    };
  };

  (sdk as any).funding.pollDepositStatus = async (txId: string) => {
    console.log(`[Funding] Monitoring deposit ${txId} on Stellar ledger...`);
    await new Promise(r => setTimeout(r, 1500)); // Simulate wait
    console.log("✅ [Funding] Payment confirmed! Tokens (BRLT) received in Sovereign Wallet.");
    return true;
  };

  (sdk as any).funding.ensureTrustline = async (address: string) => {
    console.log(`[Stellar] Ensuring BRLT Trustline for ${address}...`);
    return "trust_hash_123";
  };

  // Mocking MandateService methods
  (sdk as any).mandate.issueMandate = async (issuer: string, agent: string, limit: number) => {
    console.log(`[Nexus] Registering Mandate: Agent ${agent} can spend up to ${limit} BRLT.`);
    return "mandate_hash_abc";
  };

  // --- START SIMULATION ---

  const agentAddress = "GAGENT" + Math.random().toString(36).substring(7).toUpperCase();
  const userProfile = {
    fullName: "Felipe Nunes (Sovereign User)",
    taxId: "123.456.789-00",
    preferredCurrency: "BRL" as const
  };

  console.log("🎬 ACTION: User clicks 'Connect AI Agent' in the UI");
  
  try {
    const result = await sdk.quickOnboardAgent({
      agentAddress: agentAddress,
      initialBudget: 50, // R$ 50
      profile: userProfile,
      password: "secure-password", // Used for local vault encryption
      onPixReady: (instructions) => {
        console.log("\n📲 UI UPDATE: Show QR Code to User");
        console.log("-----------------------------------");
        console.log(`PIX KEY: ${instructions.pixKey}`);
        console.log(`RAW PIX: ${instructions.qrCode.substring(0, 50)}...`);
        console.log("-----------------------------------\n");
        console.log("⏱️ Simulating user paying the PIX via bank app...");
      }
    });

    console.log("\n🎉 SIMULATION SUCCESSFUL!");
    console.log("===========================================");
    console.log(`User Address:   ${result.soulId}`);
    console.log(`Agent Account:  ${agentAddress}`);
    console.log(`Mandate Hash:   ${result.txHash}`);
    console.log("Status:         AGENT AUTHORIZED AND READY");
    console.log("===========================================");

  } catch (error: any) {
    console.error("\n❌ Simulation Failed:", error.message);
  }
}

main().catch(console.error);
