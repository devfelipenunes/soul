// Zolvency Z-Pay Integration Example for Agents
// ---------------------------------------------
// This example shows how a 3rd party developer would integrate their agent
// with the Z-Pay gateway and the Zolvency Nexus.

#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, BytesN, IntoVal};

// Interface for Z-Pay (Developer would normally use the generated client)
pub struct ZPayClient;
impl ZPayClient {
    pub fn pay(
        env: &Env,
        zpay_address: &Address,
        agent: &Address,
        root_anchor: &Address,
        seller: &Address,
        token: &Address,
        amount: i128,
        mandate_id: u64,
        price_ticket: Option<PriceTicket>,
    ) {
        env.invoke_contract::<()>(
            zpay_address,
            &Symbol::new(env, "pay"),
            (agent, root_anchor, seller, token, amount, mandate_id, price_ticket).into_val(env),
        );
    }
}

// Struct matching Z-Pay's expectation
#[derive(soroban_sdk::contracttype, Clone, Debug)]
pub struct PriceTicket {
    pub base_currency: Symbol,
    pub price_per_unit: i128,
    pub timestamp: u64,
    pub signature: BytesN<64>,
}

#[contract]
pub struct MyAIAgent;

#[contractimpl]
impl MyAIAgent {
    /// Example function that triggers a payment
    pub fn execute_purchase(
        env: Env,
        zpay_addr: Address,
        root_anchor: Address,
        seller: Address,
        token: Address,
        amount: i128,
        mandate_id: u64,
        price_ticket: PriceTicket,
    ) {
        // The Agent calls Z-Pay to perform the payment.
        // Z-Pay will internally verify the authority with Nexus.
        ZPayClient::pay(
            &env,
            &zpay_addr,
            &env.current_contract_address(), // The Agent itself
            &root_anchor,
            &seller,
            &token,
            amount,
            mandate_id,
            Some(price_ticket),
        );
        
        // Audit log or follow-up logic
        env.events().publish((Symbol::new(&env, "AgentPurchase"),), amount);
    }
}
