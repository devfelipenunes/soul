# 🚀 Zolvency Starter Kit: Z-Pay Gateway

Bem-vindo à economia agêntica da Stellar. A **Zolvency** fornece a camada de **Soberania (Nexus/SoulID)**, e o **Z-Pay** fornece o **Trilho de Execução**.

Este kit contém os componentes necessários para integrar seu Agente de IA ao ecossistema Zolvency.

## 📦 Componentes

1.  **Contrato Z-Pay (Soroban):** Gateway de pagamento que valida mandatos no Nexus.
2.  **Oracle Mock Server (Node.js):** Provedor de preços assinados criptograficamente.
3.  **Exemplos de Integração:** Scripts demonstrando o ciclo de vida do pagamento.

---

## 🛠️ Guia de Início Rápido

### 1. Inicie o Oracle Mock
O Z-Pay exige que os preços sejam assinados por um provedor confiável.
```bash
cd sdk
npx tsx oracle/server.ts
```
O servidor rodará em `http://localhost:3001`. Você pode testar o preço com:
`curl http://localhost:3001/api/v1/price/xlm-usd`

### 2. Ciclo de Vida do Pagamento (O Fluxo do Desenvolvedor)

#### Passo A: Setup (Humano)
O dono do dinheiro (Root Anchor) deve aprovar o Z-Pay no contrato do token:
```typescript
// No SDK ou Stellar Laboratory
token.approve({ spender: ZPAY_CONTRACT_ID, amount: "1000.0" });
```

#### Passo B: Obtenha o Ticket do Oráculo (Agente)
Seu agente deve consultar o oráculo antes de pagar:
```typescript
const response = await fetch("http://localhost:3001/api/v1/price/xlm-usd");
const { ticket } = await response.json();
```

#### Passo C: Execute o Pagamento (Agente)
Chame a função `pay` no contrato Z-Pay:
```rust
zpay_client.pay(
    &agent,
    &user,
    &vendedor,
    &token_xlm,
    &100_000_0000, // 100 XLM
    &mandate_id,
    &Some(ticket)
);
```

---

## 🛡️ Segurança: O "Kill Switch"
Como desenvolvedor, você deve garantir que o usuário tenha controle.
Integre um botão no seu app que chame `revoke_mandate(mandate_id)` no contrato Nexus. Isso garante que, se o bot se comportar de forma inesperada, o usuário possa cortar o acesso financeiro instantaneamente.

---

## 📊 O Modelo Econômico
Cada transação processada pelo Z-Pay recolhe:
*   **Base:** Valor do produto.
*   **Protocol Fee:** Taxa enviada para o Tesouro do Nexus (Zolvency Protocol).
*   **Service Fee:** Taxa do gateway Z-Pay.

Isso garante que sua infraestrutura seja sustentável enquanto protege o capital do usuário.
