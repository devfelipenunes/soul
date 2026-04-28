import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
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
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
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
  treasury: string;
}

export type DataKey = {tag: "AxelarConfig", values: void} | {tag: "LayerZeroConfig", values: void} | {tag: "InteropConfig", values: void};


export interface GithubData {
  contributions: u32;
  expires_at: u64;
  external_id: string;
  minted_at: u64;
  passkey: Option<Buffer>;
  proof_data: Buffer;
  tier: Tier;
  updated_at: u64;
  username: string;
}


export interface MintParams {
  contributions: u32;
  external_id: string;
  nonce: u64;
  passkey: Option<Buffer>;
  passkey_signature: Option<Buffer>;
  proof_data: Buffer;
  username: string;
}


export interface AxelarConfig {
  gas_service: string;
  gas_token: string;
  gateway: string;
}


export interface MessagingFee {
  lz_token_fee: i128;
  native_fee: i128;
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


export interface AxelarGasToken {
  address: string;
  amount: i128;
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


export interface MessagingReceipt {
  fee: MessagingFee;
  guid: Buffer;
  nonce: u64;
}

export interface Client {
  /**
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint: ({caller, signature, params, _referrer, cross_chain}: {caller: string, signature: Buffer, params: MintParams, _referrer: Option<string>, cross_chain: Option<CrossChainParams>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: ({admin, new_wasm_hash}: {admin: string, new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a is_valid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_valid: ({token_id}: {token_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_nonce transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_nonce: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_expiry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_expiry: ({token_id}: {token_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_source transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_source: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, registry, fee_token, access_control, treasury, mint_fee}: {admin: string, registry: string, fee_token: string, access_control: string, treasury: string, mint_fee: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_metadata transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_metadata: (options?: MethodOptions) => Promise<AssembledTransaction<TokenMetadata>>

  /**
   * Construct and simulate a get_mint_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_mint_fee: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a has_identity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_identity: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_mint_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_mint_fee: ({admin, new_fee}: {admin: string, new_fee: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_treasury: ({admin, treasury}: {admin: string, treasury: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a update_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_token: ({caller, token_id, username, contributions, proof_data, cross_chain}: {caller: string, token_id: u64, username: string, contributions: u32, proof_data: Buffer, cross_chain: Option<CrossChainParams>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_token_svg transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token_svg: ({token_id}: {token_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a get_token_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token_data: ({token_id}: {token_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<GithubData>>>

  /**
   * Construct and simulate a get_token_type transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token_type: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_user_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_token: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_owner_passkey transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner_passkey: ({token_id}: {token_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Buffer>>>

  /**
   * Construct and simulate a set_axelar_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_axelar_config: ({admin, gateway, gas_service, gas_token}: {admin: string, gateway: string, gas_service: string, gas_token: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_access_control transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_access_control: ({admin, access_control}: {admin: string, access_control: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a list_tokens_of_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_tokens_of_user: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a set_active_protocol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_active_protocol: ({admin, protocol, adapter}: {admin: string, protocol: InteropProtocol, adapter: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_layerzero_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_layerzero_config: ({admin, endpoint}: {admin: string, endpoint: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAABFRpZXIAAAAFAAAAAAAAAAAAAAAGTm92aWNlAAAAAAAAAAAAAAAAAANQcm8AAAAAAAAAAAAAAAAJQXJjaGl0ZWN0AAAAAAAAAAAAAAAAAAAGTGVnZW5kAAAAAAAAAAAAAAAAAAtTaW5ndWxhcml0eQA=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADwAAAAAAAAASQWxyZWFkeUhhc0lkZW50aXR5AAAAAAABAAAAAAAAAA9Ob0lkZW50aXR5Rm91bmQAAAAAAgAAAAAAAAALSW52YWxpZFRpZXIAAAAAAwAAAAAAAAAMSW52YWxpZE5vbmNlAAAABAAAAAAAAAAQSW52YWxpZFNpZ25hdHVyZQAAAAUAAAAAAAAAE0luc3VmZmljaWVudFBheW1lbnQAAAAABgAAAAAAAAASVHJhbnNmZXJOb3RBbGxvd2VkAAAAAAAHAAAAAAAAAA1FbXB0eVVzZXJuYW1lAAAAAAAACAAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAkAAAAAAAAACE5vdEFkbWluAAAACgAAAAAAAAANVG9rZW5Ob3RGb3VuZAAAAAAAAAsAAAAAAAAAEkFjY2Vzc0NvbnRyb2xFcnJvcgAAAAAADAAAAAAAAAAMVW5hdXRob3JpemVkAAAADQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAAOAAAAAAAAAA1TeWJpbENvbmZsaWN0AAAAAAAADw==",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABgAAAAAAAAAOYWNjZXNzX2NvbnRyb2wAAAAAABMAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAJZmVlX3Rva2VuAAAAAAAAEwAAAAAAAAAIbWludF9mZWUAAAALAAAAAAAAAAhyZWdpc3RyeQAAABMAAAAAAAAACHRyZWFzdXJ5AAAAEw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAADEF4ZWxhckNvbmZpZwAAAAAAAAAAAAAAD0xheWVyWmVyb0NvbmZpZwAAAAAAAAAAAAAAAA1JbnRlcm9wQ29uZmlnAAAA",
        "AAAAAQAAAAAAAAAAAAAACkdpdGh1YkRhdGEAAAAAAAkAAAAAAAAADWNvbnRyaWJ1dGlvbnMAAAAAAAAEAAAAAAAAAApleHBpcmVzX2F0AAAAAAAGAAAAAAAAAAtleHRlcm5hbF9pZAAAAAAQAAAAAAAAAAltaW50ZWRfYXQAAAAAAAAGAAAAAAAAAAdwYXNza2V5AAAAA+gAAAPuAAAAQQAAAAAAAAAKcHJvb2ZfZGF0YQAAAAAADgAAAAAAAAAEdGllcgAAB9AAAAAEVGllcgAAAAAAAAAKdXBkYXRlZF9hdAAAAAAABgAAAAAAAAAIdXNlcm5hbWUAAAAQ",
        "AAAAAQAAAAAAAAAAAAAACk1pbnRQYXJhbXMAAAAAAAcAAAAAAAAADWNvbnRyaWJ1dGlvbnMAAAAAAAAEAAAAAAAAAAtleHRlcm5hbF9pZAAAAAAQAAAAAAAAAAVub25jZQAAAAAAAAYAAAAAAAAAB3Bhc3NrZXkAAAAD6AAAA+4AAABBAAAAAAAAABFwYXNza2V5X3NpZ25hdHVyZQAAAAAAA+gAAAPuAAAAQAAAAAAAAAAKcHJvb2ZfZGF0YQAAAAAADgAAAAAAAAAIdXNlcm5hbWUAAAAQ",
        "AAAAAQAAAAAAAAAAAAAADEF4ZWxhckNvbmZpZwAAAAMAAAAAAAAAC2dhc19zZXJ2aWNlAAAAABMAAAAAAAAACWdhc190b2tlbgAAAAAAABMAAAAAAAAAB2dhdGV3YXkAAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAADE1lc3NhZ2luZ0ZlZQAAAAIAAAAAAAAADGx6X3Rva2VuX2ZlZQAAAAsAAAAAAAAACm5hdGl2ZV9mZWUAAAAAAAs=",
        "AAAAAQAAAAAAAAAAAAAADUludGVyb3BDb25maWcAAAAAAAACAAAAAAAAAA9hY3RpdmVfcHJvdG9jb2wAAAAH0AAAAA9JbnRlcm9wUHJvdG9jb2wAAAAAAAAAAA9hZGFwdGVyX2FkZHJlc3MAAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAAEAAAAAAAAAAtkYXRhX3NvdXJjZQAAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQAAAAAAAAAAd2ZXJzaW9uAAAAABA=",
        "AAAAAQAAAAAAAAAAAAAADkF4ZWxhckdhc1Rva2VuAAAAAAACAAAAAAAAAAdhZGRyZXNzAAAAABMAAAAAAAAABmFtb3VudAAAAAAACw==",
        "AAAAAgAAAAAAAAAAAAAAD0ludGVyb3BQcm90b2NvbAAAAAAEAAAAAAAAAAAAAAAETm9uZQAAAAAAAAAAAAAABkF4ZWxhcgAAAAAAAAAAAAAAAAAJTGF5ZXJaZXJvAAAAAAAAAAAAAAAAAAAIV29ybWhvbGU=",
        "AAAAAQAAAAAAAAAAAAAAD0xheWVyWmVyb0NvbmZpZwAAAAABAAAAAAAAAAhlbmRwb2ludAAAABM=",
        "AAAAAQAAAAAAAAAAAAAAEENyb3NzQ2hhaW5QYXJhbXMAAAADAAAAAAAAABNkZXN0aW5hdGlvbl9hZGRyZXNzAAAAABAAAAAAAAAAEWRlc3RpbmF0aW9uX2NoYWluAAAAAAAAEAAAAAAAAAAYdXNlcl9kZXN0aW5hdGlvbl9hZGRyZXNzAAAADg==",
        "AAAAAQAAAAAAAAAAAAAAEE1lc3NhZ2luZ1JlY2VpcHQAAAADAAAAAAAAAANmZWUAAAAH0AAAAAxNZXNzYWdpbmdGZWUAAAAAAAAABGd1aWQAAAPuAAAAIAAAAAAAAAAFbm9uY2UAAAAAAAAG",
        "AAAAAAAAAAAAAAAEbWludAAAAAUAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAJc2lnbmF0dXJlAAAAAAAD7gAAAEAAAAAAAAAABnBhcmFtcwAAAAAH0AAAAApNaW50UGFyYW1zAAAAAAAAAAAACV9yZWZlcnJlcgAAAAAAA+gAAAATAAAAAAAAAAtjcm9zc19jaGFpbgAAAAPoAAAH0AAAABBDcm9zc0NoYWluUGFyYW1zAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAAAAAAAAIaXNfdmFsaWQAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAYAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAJZ2V0X25vbmNlAAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAABg==",
        "AAAAAAAAAAAAAAAKZ2V0X2V4cGlyeQAAAAAAAQAAAAAAAAAIdG9rZW5faWQAAAAGAAAAAQAAAAY=",
        "AAAAAAAAAAAAAAAKZ2V0X3NvdXJjZQAAAAAAAAAAAAEAAAAQ",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAhyZWdpc3RyeQAAABMAAAAAAAAACWZlZV90b2tlbgAAAAAAABMAAAAAAAAADmFjY2Vzc19jb250cm9sAAAAAAATAAAAAAAAAAh0cmVhc3VyeQAAABMAAAAAAAAACG1pbnRfZmVlAAAACwAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAAAAAAAAMZ2V0X21ldGFkYXRhAAAAAAAAAAEAAAfQAAAADVRva2VuTWV0YWRhdGEAAAA=",
        "AAAAAAAAAAAAAAAMZ2V0X21pbnRfZmVlAAAAAAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAMaGFzX2lkZW50aXR5AAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAMc2V0X21pbnRfZmVlAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAduZXdfZmVlAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAAAAAAAAMc2V0X3RyZWFzdXJ5AAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAh0cmVhc3VyeQAAABMAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAAAAAAAAMdXBkYXRlX3Rva2VuAAAABgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAh0b2tlbl9pZAAAAAYAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAAAAAANY29udHJpYnV0aW9ucwAAAAAAAAQAAAAAAAAACnByb29mX2RhdGEAAAAAAA4AAAAAAAAAC2Nyb3NzX2NoYWluAAAAA+gAAAfQAAAAEENyb3NzQ2hhaW5QYXJhbXMAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAAAAAAAANZ2V0X3Rva2VuX3N2ZwAAAAAAAAEAAAAAAAAACHRva2VuX2lkAAAABgAAAAEAAAPpAAAAEAAAAAM=",
        "AAAAAAAAAAAAAAAOZ2V0X3Rva2VuX2RhdGEAAAAAAAEAAAAAAAAACHRva2VuX2lkAAAABgAAAAEAAAPpAAAH0AAAAApHaXRodWJEYXRhAAAAAAAD",
        "AAAAAAAAAAAAAAAOZ2V0X3Rva2VuX3R5cGUAAAAAAAAAAAABAAAAEQ==",
        "AAAAAAAAAAAAAAAOZ2V0X3VzZXJfdG9rZW4AAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAAAAAAAARZ2V0X293bmVyX3Bhc3NrZXkAAAAAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAYAAAABAAAD6AAAA+4AAABB",
        "AAAAAAAAAAAAAAARc2V0X2F4ZWxhcl9jb25maWcAAAAAAAAEAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAB2dhdGV3YXkAAAAAEwAAAAAAAAALZ2FzX3NlcnZpY2UAAAAAEwAAAAAAAAAJZ2FzX3Rva2VuAAAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAAAAAAAASc2V0X2FjY2Vzc19jb250cm9sAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAADmFjY2Vzc19jb250cm9sAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
        "AAAAAAAAAAAAAAATbGlzdF90b2tlbnNfb2ZfdXNlcgAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPqAAAABg==",
        "AAAAAAAAAAAAAAATc2V0X2FjdGl2ZV9wcm90b2NvbAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACHByb3RvY29sAAAH0AAAAA9JbnRlcm9wUHJvdG9jb2wAAAAAAAAAAAdhZGFwdGVyAAAAABMAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAAAAAAAAUc2V0X2xheWVyemVyb19jb25maWcAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACGVuZHBvaW50AAAAEwAAAAEAAAPpAAAD7QAAAAAAAAAD" ]),
      options
    )
  }
  public readonly fromJSON = {
    mint: this.txFromJSON<Result<u64>>,
        upgrade: this.txFromJSON<Result<void>>,
        is_valid: this.txFromJSON<boolean>,
        get_nonce: this.txFromJSON<u64>,
        get_expiry: this.txFromJSON<u64>,
        get_source: this.txFromJSON<string>,
        initialize: this.txFromJSON<Result<void>>,
        get_metadata: this.txFromJSON<TokenMetadata>,
        get_mint_fee: this.txFromJSON<i128>,
        has_identity: this.txFromJSON<boolean>,
        set_mint_fee: this.txFromJSON<Result<void>>,
        set_treasury: this.txFromJSON<Result<void>>,
        update_token: this.txFromJSON<Result<void>>,
        get_token_svg: this.txFromJSON<Result<string>>,
        get_token_data: this.txFromJSON<Result<GithubData>>,
        get_token_type: this.txFromJSON<string>,
        get_user_token: this.txFromJSON<Result<u64>>,
        get_owner_passkey: this.txFromJSON<Option<Buffer>>,
        set_axelar_config: this.txFromJSON<Result<void>>,
        set_access_control: this.txFromJSON<Result<void>>,
        list_tokens_of_user: this.txFromJSON<Array<u64>>,
        set_active_protocol: this.txFromJSON<Result<void>>,
        set_layerzero_config: this.txFromJSON<Result<void>>
  }
}