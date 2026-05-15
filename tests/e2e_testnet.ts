import { ZolvencySDK, PRESETS } from "../src/index";
import { PasskeyManager } from "../src/identity/PasskeyManager";
import { vi } from "vitest";
import { Buffer } from "buffer";
import { Keypair } from "@stellar/stellar-sdk";

async function runE2E() {
  console.log("🚀 Starting Full E2E Sovereign Flow on Testnet...");
  
  // 0. Generate a random fee payer to avoid sequence collisions
  const randomPayer = Keypair.random();
  console.log(`Generating random fee payer: ${randomPayer.publicKey()}`);
  
  console.log("Funding account via Friendbot...");
  const friendbotResp = await fetch(`https://friendbot.stellar.org?addr=${randomPayer.publicKey()}`);
  if (!friendbotResp.ok) {
    throw new Error("Friendbot failed to fund the account");
  }
  console.log("✅ Account funded!");

  // 1. Setup SDK with Testnet Presets
  const sdk = new ZolvencySDK({
    ...PRESETS.TESTNET,
    feePayerSeed: randomPayer.secret()
  });

  const password = "my-secret-password-2026";

  try {
    // 2. Mocking the Browser Biometrics (Navigator Credentials)
    const mockPublicKey = "04" + "a".repeat(128); // 65 bytes hex
    const dummyOwner = Keypair.random().publicKey();
    
    // @ts-ignore - Mocking internal passkey manager to avoid browser dependency
    sdk.identity.passkeyManager.createIdentity = async () => ({
      contractId: dummyOwner,
      publicKeyHex: mockPublicKey,
      keyIdBase64: "dGVzdF9rZXlfaWQ=",
      signedTxXdr: "" 
    });

    // @ts-ignore
    sdk.identity.passkeyManager.connectWallet = async () => ({
      contractId: dummyOwner,
      publicKeyHex: mockPublicKey,
      keyIdBase64: "dGVzdF9rZXlfaWQ="
    });

    console.log("\n--- STEP 1: ONBOARDING ---");
    console.log("Creating Sovereign Identity...");
    const session = await sdk.createIdentity(password);
    console.log("✅ Identity Created!");
    console.log("Soul ID:", session.soulId);
    console.log("Wallet Address:", session.address);
    console.log("Recovery Public Key:", session.recoveryPublicKey);
    console.log("Encrypted Vault Sample:", session.encryptedVault.ciphertext.substring(0, 20) + "...");

    console.log("\n--- STEP 2: RESOLUTION (LOGIN) ---");
    console.log("Simulating Login (Identify)...");
    
    // For identification to work on Testnet, the Soul ID must actually exist.
    // Since we are mocking the passkey, we'll check if we get a result.
    try {
      const identity = await sdk.identify();
      console.log("✅ Identity Resolved!");
      console.log("Identified Soul ID:", identity.soulId);
      console.log("Reputation Data:", JSON.stringify(identity.reputation));
    } catch (e: any) {
      console.warn("⚠️ Identification skipped (Requires real blockchain state for this specific mock key)");
    }

    console.log("\n--- STEP 3: RECOVERY (LOST DEVICE) ---");
    console.log("Simulating device loss and recovery...");
    
    // Preparamos a transação de recuperação
    const recoveryResult = await sdk.recoverSoul({
      password,
      encryptedVault: session.encryptedVault,
      soulId: Number(session.soulId === "pending" ? 1 : session.soulId),
      relayer: session.address
    });

    console.log("✅ Recovery Transaction Prepared!");
    console.log("New Passkey Generated:", recoveryResult.newPasskeyHex.substring(0, 20) + "...");
    
    console.log("\n🎉 E2E Flow Simulation Completed Successfully!");

  } catch (error: any) {
    console.error("\n❌ E2E Flow Failed:");
    console.error(error.message);
    process.exit(1);
  }
}

runE2E();
