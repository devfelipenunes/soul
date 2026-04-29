import { ZolvencySDK, PRESETS } from "./src";

async function findContract() {
  const candidates = [
    "CAZUKAFB5XHZKFZR7B5HIKB6BBMYSZIV3V2VWFTQWKYEMONWK2ZLTZCT",
    "CB2JYOOZPHO43R57TC5PXV22QICKIDC5NKRF62BZG2J6JYFUIQPIAYY3",
    "CBO2KVJVGTQF5ZJWECXQQCXEU65ZLR5XTQZJ5MZTE6LBXEDONONJMNYF",
    "CCLZOCGHHC6F6JCZHEUP53LDQHRBPPCNRYXOVFZFS3O63OGRC47CKCGV",
    "CCSNWHMQSPTW4PS7L32OIMH7Z6NFNCKYZKNFSWRSYX7MK64KHBDZDT5I",
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
  ];

  console.log("🔍 Scanning for the correct Zolvency Registry contract...");

  for (const id of candidates) {
    const sdk = new ZolvencySDK({
      ...PRESETS.TESTNET,
      hubAddress: id
    });

    try {
      console.log(`Testing ID: ${id}...`);
      const signer = await sdk.getSigner();
      console.log(`✅ FOUND! Contract is live at: ${id}`);
      console.log(`Admin Signer: ${signer}`);
      return;
    } catch (e: any) {
      if (e.message.includes("non-existent contract function")) {
        console.log(`❌ ${id} exists but is a DIFFERENT contract.`);
      } else if (e.message.includes("not found")) {
        console.log(`❌ ${id} does not exist on Testnet.`);
      } else {
        console.log(`⚠️  ${id} returned error: ${e.message.substring(0, 50)}...`);
      }
    }
  }
  console.log("😿 No valid Registry contract found in candidates.");
}

findContract();
