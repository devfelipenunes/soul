import { Transaction } from "@stellar/stellar-sdk";

export interface WalletAdapter {
  /**
   * Identificador único da carteira (ex: "freighter", "xbull")
   */
  id: string;
  /**
   * Verifica se a extensão/carteira está instalada e disponível
   */
  isInstalled(): Promise<boolean>;
  /**
   * Solicita a conexão do usuário e retorna a chave pública
   */
  connect(): Promise<string>;
  /**
   * Assina a transação XDR e a devolve assinada
   */
  signTransaction(tx: Transaction, networkPassphrase: string): Promise<Transaction>;
}
