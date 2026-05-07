import { Keypair } from '@stellar/stellar-sdk';
import axios from 'axios';

/**
 * ZOLVENCY AGENT SIMULATOR (Sandbox)
 * ---------------------------------
 * This script automates the behavior of an AI Agent.
 * It simulates:
 * 1. Listening for a Mandate (Will).
 * 2. Fetching Signed Prices from the Oracle.
 * 3. Executing payments via Z-Pay.
 * 4. Handling Revocations (Panic Button test).
 */

// Configuration
const ORACLE_URL = "http://localhost:3001";
const SIMULATION_INTERVAL_MS = 5000; // Run every 5 seconds

class ZolvencyAgent {
    private agentKey: Keypair;
    private mandateId: number | null = null;
    private isRunning: boolean = false;
    private spentUSD: number = 0;
    private limitUSD: number = 100.00;

    constructor() {
        this.agentKey = Keypair.random();
        console.log(`\n[Agent] Starting Sandbox Agent: ${this.agentKey.publicKey()}`);
    }

    /**
     * Step 1: Simulate detecting a mandate from the user
     */
    public async bootstrap(id: number, limit: number) {
        this.mandateId = id;
        this.limitUSD = limit;
        console.log(`[Agent] Mandate #${id} detected! Spending limit: $${limit} USD`);
        this.isRunning = true;
        this.loop();
    }

    /**
     * Main execution loop
     */
    private async loop() {
        while (this.isRunning) {
            console.log(`\n--- Cycle Start ---`);
            try {
                // 1. Fetch Oracle Price
                console.log(`[Agent] Fetching signed price for XLM/USD...`);
                const response = await axios.get(`${ORACLE_URL}/api/v1/price/xlm-usd`);
                const { ticket, price } = response.data.data;

                // 2. Decide amount to buy (Simulating "Intelligence")
                const amountXLM = 50 + Math.random() * 20; // Buy 50-70 XLM
                const costUSD = amountXLM * price;

                console.log(`[Agent] Intention: Buy ${amountXLM.toFixed(2)} XLM (~$${costUSD.toFixed(2)} USD)`);

                // 3. Pre-flight check: Am I within the budget?
                if (this.spentUSD + costUSD > this.limitUSD) {
                    console.log(`[Agent] ALERT: This purchase would exceed my limit! Stopping to wait for refill.`);
                    this.isRunning = false;
                    break;
                }

                // 4. Call Z-Pay (Simulated Contract Call)
                console.log(`[Agent] Calling Z-Pay::pay(mandate: ${this.mandateId}, amount: ${amountXLM.toFixed(2)})...`);
                
                // --- SIMULATION Logic for Success/Failure ---
                // In a real agent, this would be a Soroban transaction.
                // Here we simulate the Nexus response.
                const isRevoked = Math.random() < 0.1; // 10% chance to simulate user pressing "Panic Button"

                if (isRevoked) {
                    throw new Error("NexusRejected: Mandate has been revoked by Root Anchor (Panic Button)");
                }

                this.spentUSD += costUSD;
                console.log(`[Agent] ✅ Success! Transfer finalized.`);
                console.log(`[Agent] Dashboard Update: Spent $${this.spentUSD.toFixed(2)} / $${this.limitUSD.toFixed(2)}`);

            } catch (error: any) {
                console.error(`[Agent] ❌ FAILED: ${error.message}`);
                if (error.message.includes("revoked")) {
                    console.log(`[Agent] My authority was cut off. Shutting down immediately for safety.`);
                    this.isRunning = false;
                }
            }

            await new Promise(r => setTimeout(resolve => r(resolve), SIMULATION_INTERVAL_MS));
        }
        console.log(`\n[Agent] Simulation Ended.`);
    }

    public stop() {
        this.isRunning = false;
    }
}

// --- RUN SIMULATION ---
async function startSim() {
    console.log("=========================================");
    console.log("   ZOLVENCY PERFECT AGENT SIMULATION     ");
    console.log("=========================================");
    
    const agent = new ZolvencyAgent();
    
    // We assume the user already created Mandate #42 with a $200 limit in the Nexus
    await agent.bootstrap(42, 200.00);
}

// Check if Oracle is running before starting
axios.get(`${ORACLE_URL}/api/v1/price/xlm-usd`)
    .then(() => startSim())
    .catch(() => {
        console.error("ERROR: Oracle Server not found! Please run 'npx tsx oracle/server.ts' first.");
        process.exit(1);
    });
