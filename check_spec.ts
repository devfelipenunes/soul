import { ZolvencySDK, PRESETS } from "./src/index";
import * as Soul from "./src/contracts/soul";
import { Keypair, Buffer, rpc, Address, xdr } from "@stellar/stellar-sdk";
import { Client as ContractClient, Spec } from "@stellar/stellar-sdk/contract";

async function checkSpec() {
  const soulId = "CCCIUG44CRVATMQ3I3YLOSWRGMPOEPQNUWJSYWWIL337AO7E224ATGBA";
  const client = new Soul.Client({
    ...PRESETS.TESTNET,
    contractId: soulId
  });
  
  console.log("Checking initialization for:", soulId);
  
  try {
    const adminTx = await client.admin();
    const adminAddress = (adminTx.result as any).unwrap();
    console.log("✅ Contract is already initialized. Admin:", adminAddress);
    
    const owner = Keypair.random().publicKey();
    const key65 = new Uint8Array(65);
    key65.fill(0x0f);
    
    const assembled = await client.mint({
      relayer: adminAddress, // Use the real admin as relayer for simulation
      owner,
      passkey: key65,
      recovery_pubkey: key65
    });
    await assembled.simulate();
    console.log("✅ Simulation with 4 args SUCCEEDED on CCCI...!");
  } catch (e: any) {
    console.log("❌ Failed on CCCI...:", e.message);
  }
}

checkSpec();
