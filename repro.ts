import { ZolvencySDK } from "./src";

async function test() {
  console.log("🧪 Testing ZolvencySDK.fromEnv() with auto-loaded configuration...");
  
  // No config passed, will use .env, but setting logLevel explicitly
  const sdk = new ZolvencySDK({ logLevel: 4 }); // 4 = DEBUG

  const user = "GDC4TEW24H645D3IP7YLT7D7ODL4W6Y4S3XNDAG47TOCBUCQU3E4S2OQ";
  // The SDK expects a valid Stellar G... address
  
  try {
    console.log(`Attempting call for user ${user}...`);
    const score = await sdk.getScore(user);
    console.log("Success! User Score Data:", JSON.stringify(score, null, 2));
  } catch (e: any) {
    console.error("Caught error:", e.message);
    console.error("Trace:", e.stack);
  }
}

test();
