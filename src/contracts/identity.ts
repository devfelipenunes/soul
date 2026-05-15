import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export type Tier = {tag: "Novice", values: void} | {tag: "Pro", values: void} | {tag: "Architect", values: void} | {tag: "Legend", values: void} | {tag: "Singularity", values: void};

export const Errors = {
  1: {message:"AlreadyHasIdentity"},

  2: {message:"NoIdentityFound"},

  3: {message:"InvalidTier"},

  4: {message:"InvalidNonce"},

  5: {message:"InvalidSignature"},

  6: {message:"InsufficientPayment"},

  7: {message:"TransferNotAllowed"},

  8: {message:"EmptyUsername"},

  9: {message:"NotInitialized"},

  10: {message:"NotAdmin"},

  11: {message:"TokenNotFound"},

  12: {message:"AccessControlError"},

  13: {message:"Unauthorized"},

  14: {message:"AlreadyInitialized"},

  15: {message:"SybilConflict"}
}

export interface Config {
  access_control: string;
  admin: string;
  fee_token: string;
  mint_fee: i128;
  registry: string;
  soul_contract: string;
  treasury: string;
  zk_verifier: Option<string>;
}

export type DataKey = {tag: "AxelarConfig", values: void} | {tag: "LayerZeroConfig", values: void} | {tag: "InteropConfig", values: void};


export interface GithubData {
  contributions: u32;
  expires_at: u64;
  external_id: string;
  minted_at: u64;
  proof_data: Buffer;
  soul_id: u32;
  tier: Tier;
  updated_at: u64;
  username: string;
}


export interface MintParams {
  contributions: u32;
  external_id: string;
  nonce: u64;
  proof_data: Buffer;
  username: string;
}


export interface AxelarConfig {
  gas_service: string;
  gas_token: string;
  gateway: string;
}


export interface InteropConfig {
  active_protocol: InteropProtocol;
  adapter_address: string;
}


export interface TokenMetadata {
  data_source: string;
  name: string;
  symbol: string;
  version: string;
}

export type InteropProtocol = {tag: "None", values: void} | {tag: "Axelar", values: void} | {tag: "LayerZero", values: void} | {tag: "Wormhole", values: void};


export interface LayerZeroConfig {
  endpoint: string;
}


export interface CrossChainParams {
  destination_address: string;
  destination_chain: string;
  user_destination_address: Buffer;
}


export interface Client {
  /**
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint: ({caller, soul_id, params}: {caller: string, soul_id: u32, params: MintParams}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: ({admin, new_wasm_hash}: {admin: string, new_wasm_hash: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a is_valid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_valid: ({token_id}: {token_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_expiry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_expiry: ({token_id}: {token_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_source transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_source: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, registry, soul_contract, fee_token, access_control, treasury, mint_fee}: {admin: string, registry: string, soul_contract: string, fee_token: string, access_control: string, treasury: string, mint_fee: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_metadata transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_metadata: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<TokenMetadata>>

  /**
   * Construct and simulate a has_identity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_identity: ({soul_id}: {soul_id: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_owner_soul transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner_soul: ({token_id}: {token_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_token_type transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token_type: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_user_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_token: ({soul_id}: {soul_id: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "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",
        "AAAAAQAAAAAAAAAAAAAACkdpdGh1YkRhdGEAAAAAAAkAAAAAAAAADWNvbnRyaWJ1dGlvbnMAAAAAAAAEAAAAAAAAAApleHBpcmVzX2F0AAAAAAAGAAAAAAAAAAtleHRlcm5hbF9pZAAAAAAQAAAAAAAAAAltaW50ZWRfYXQAAAAAAAAGAAAAAAAAAApwcm9vZl9kYXRhAAAAAAAOAAAAAAAAAAdzb3VsX2lkAAAAAAQAAAAAAAAABHRpZXIAAAfQAAAABFRpZXIAAAAAAAAACnVwZGF0ZWRfYXQAAAAAAAYAAAAAAAAACHVzZXJuYW1lAAAAEA==",
        "AAAAAQAAAAAAAAAAAAAACk1pbnRQYXJhbXMAAAAAAAUAAAAAAAAADWNvbnRyaWJ1dGlvbnMAAAAAAAAEAAAAAAAAAAtleHRlcm5hbF9pZAAAAAAQAAAAAAAAAAVub25jZQAAAAAAAAYAAAAAAAAACnByb29mX2RhdGEAAAAAAA4AAAAAAAAACHVzZXJuYW1lAAAAEA==",
        "AAAAAQAAAAAAAAAAAAAADEF4ZWxhckNvbmZpZwAAAAMAAAAAAAAAC2dhc19zZXJ2aWNlAAAAABMAAAAAAAAACWdhc190b2tlbgAAAAAAABMAAAAAAAAAB2dhdGV3YXkAAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAADUludGVyb3BDb25maWcAAAAAAAACAAAAAAAAAA9hY3RpdmVfcHJvdG9jb2wAAAAH0AAAAA9JbnRlcm9wUHJvdG9jb2wAAAAAAAAAAA9hZGFwdGVyX2FkZHJlc3MAAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAAEAAAAAAAAAAtkYXRhX3NvdXJjZQAAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQAAAAAAAAAAd2ZXJzaW9uAAAAABA=",
        "AAAAAgAAAAAAAAAAAAAAD0ludGVyb3BQcm90b2NvbAAAAAAEAAAAAAAAAAAAAAAETm9uZQAAAAAAAAAAAAAABkF4ZWxhcgAAAAAAAAAAAAAAAAAJTGF5ZXJaZXJvAAAAAAAAAAAAAAAAAAAIV29ybWhvbGU=",
        "AAAAAQAAAAAAAAAAAAAAD0xheWVyWmVyb0NvbmZpZwAAAAABAAAAAAAAAAhlbmRwb2ludAAAABM=",
        "AAAAAQAAAAAAAAAAAAAAEENyb3NzQ2hhaW5QYXJhbXMAAAADAAAAAAAAABNkZXN0aW5hdGlvbl9hZGRyZXNzAAAAABAAAAAAAAAAEWRlc3RpbmF0aW9uX2NoYWluAAAAAAAAEAAAAAAAAAAYdXNlcl9kZXN0aW5hdGlvbl9hZGRyZXNzAAAADg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    mint: this.txFromJSON<u64>,
        upgrade: this.txFromJSON<Result<void>>,
        is_valid: this.txFromJSON<boolean>,
        get_expiry: this.txFromJSON<u64>,
        get_source: this.txFromJSON<string>,
        initialize: this.txFromJSON<Result<void>>,
        get_metadata: this.txFromJSON<TokenMetadata>,
        has_identity: this.txFromJSON<boolean>,
        get_owner_soul: this.txFromJSON<u32>,
        get_token_type: this.txFromJSON<string>,
        get_user_token: this.txFromJSON<u64>
  }
}