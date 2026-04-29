import { 
    Address, 
    Contract, 
    Keypair, 
    Networks, 
    Operation, 
    TransactionBuilder, 
    rpc, 
    StrKey,
    xdr
} from '@stellar/stellar-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(RPC_URL);

// Carrega chaves do .env
const envFile = readFileSync('../contracts/.env', 'utf8');
const deployerSecret = envFile.match(/DEPLOYER_SECRET=(S[A-Z0-9]+)/)[1];
const deployerKp = Keypair.fromSecret(deployerSecret);

async function deployContract(wasmPath) {
    console.log(`🚀 Deploying ${wasmPath}...`);
    const wasmBuffer = readFileSync(wasmPath);
    
    const account = await server.getAccount(deployerKp.publicKey());
    
    // 1. Upload WASM
    let tx = new TransactionBuilder(account, {
        fee: '1000000',
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(Operation.uploadContractWasm({ wasm: wasmBuffer }))
    .setTimeout(30)
    .build();

    console.log("🛠️ Preparing Upload Wasm transaction...");
    const preparedTx = await server.prepareTransaction(tx);
    preparedTx.sign(deployerKp);
    
    console.log("📤 Sending Upload Wasm...");
    const sendResponse = await server.sendTransaction(preparedTx);
    if (sendResponse.status === 'ERROR') throw new Error(JSON.stringify(sendResponse));
    
    console.log("⏳ Waiting for confirmation...");
    let result = await pollStatus(sendResponse.hash);
    const wasmHash = result.returnValue.bytes().toString('hex');
    console.log(`✅ WASM Uploaded. Hash: ${wasmHash}`);

    // 2. Instantiate Contract
    console.log("🏗️ Instantiating contract...");
    tx = new TransactionBuilder(account, {
        fee: '1000000',
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(Operation.createCustomContract({
        wasmHash: Buffer.from(wasmHash, 'hex'),
        address: deployerKp.publicKey(),
    }))
    .setTimeout(30)
    .build();

    const preparedInst = await server.prepareTransaction(tx);
    preparedInst.sign(deployerKp);
    
    const instResponse = await server.sendTransaction(preparedInst);
    const instResult = await pollStatus(instResponse.hash);
    
    // O ID do contrato está no resultado da operação
    const contractId = StrKey.encodeContract(instResult.returnValue.address().contractId());
    console.log(`🎉 Contract Deployed! ID: ${contractId}`);
    return contractId;
}

async function pollStatus(hash) {
    let response = await server.getTransaction(hash);
    while (response.status === 'NOT_FOUND') {
        await new Promise(r => setTimeout(r, 2000));
        response = await server.getTransaction(hash);
    }
    if (response.status === 'FAILED') throw new Error('Transaction failed');
    return response;
}

const wasmFile = './wasm/zolvency_registry.wasm';
deployContract(wasmFile).catch(console.error);
