import { Keypair } from '@stellar/stellar-sdk';
import express from 'express';
import cors from 'cors';

/**
 * ZOLVENCY ORACLE MOCK SERVER
 * --------------------------
 * This server simulates a trusted price provider.
 * It signs price data using an Ed25519 private key.
 * AI Agents fetch these tickets to prove the exchange rate to the Z-Pay contract.
 */

const app = express();
app.use(cors());
app.use(express.json());

// Use environment secret or generate a new one for testing
const keypair = process.env.ORACLE_SECRET 
    ? Keypair.fromSecret(process.env.ORACLE_SECRET)
    : Keypair.random();

console.log("-----------------------------------------");
console.log("Zolvency Oracle Mock Active");
console.log("Oracle Public Key:", keypair.publicKey());
if (!process.env.ORACLE_SECRET) {
    console.log("Using generated random keypair for this session.");
}
console.log("-----------------------------------------");

// Endpoint to get a signed price ticket
app.get('/api/v1/price/:pair', (req, res) => {
    const { pair } = req.params; // e.g., "XLM-USD"
    
    // 1. Fetch real price (Mocking here)
    const mockPrices: Record<string, number> = {
        "XLM-USD": 0.1250000,
        "USDC-USD": 1.0000000,
        "EURC-USD": 1.0800000,
    };

    const price = mockPrices[pair.toUpperCase()] || 0.1000000;
    const pricePerUnit = BigInt(Math.floor(price * 10_000_000)); // Scaled by 10^7
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const baseCurrency = "USD";

    // 2. Prepare Payload for Signing
    // The payload must match exactly what Z-Pay reconstructs on-chain.
    // Order: Symbol(base_currency) + i128(price_per_unit) + u64(timestamp)
    const payload = Buffer.concat([
        Buffer.from(baseCurrency),
        bigIntToBuffer(pricePerUnit, 16), // i128 is 16 bytes
        bigIntToBuffer(timestamp, 8)     // u64 is 8 bytes
    ]);

    // 3. Sign the payload
    const signature = keypair.sign(payload);

    console.log(`[Oracle] Signed price for ${pair}: ${price} ${baseCurrency}`);

    res.json({
        success: true,
        data: {
            pair,
            price,
            ticket: {
                base_currency: baseCurrency,
                price_per_unit: pricePerUnit.toString(),
                timestamp: timestamp.toString(),
                signature: signature.toString('hex')
            }
        }
    });
});

/**
 * Helper to convert BigInt to Buffer (Big Endian)
 */
function bigIntToBuffer(value: bigint, size: number): Buffer {
    const buf = Buffer.alloc(size);
    for (let i = size - 1; i >= 0; i--) {
        buf[i] = Number(value & BigInt(0xff));
        value >>= BigInt(8);
    }
    return buf;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Oracle Mock running at http://localhost:${PORT}`);
});
