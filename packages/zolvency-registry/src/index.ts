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
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export type DataKey = {tag: "Admin", values: void} | {tag: "Signer", values: void} | {tag: "Tokens", values: void};

export interface Client {
  /**
   * Construct and simulate a get_signer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_signer: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, signer}: {admin: string, signer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a update_signer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_signer: ({admin, new_signer}: {admin: string, new_signer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a register_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register_token: ({admin, token_contract}: {admin: string, token_contract: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_user_reputation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retorna todos os tokens registrados que um usuário possui e seus dados básicos.
   * Esta função será usada pesadamente pelo SDK.
   */
  get_user_reputation: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Map<string, u64>>>

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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAGU2lnbmVyAAAAAAAAAAAAAAAAAAZUb2tlbnMAAA==",
        "AAAAAAAAAAAAAAAKZ2V0X3NpZ25lcgAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAZzaWduZXIAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAANdXBkYXRlX3NpZ25lcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAKbmV3X3NpZ25lcgAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAOcmVnaXN0ZXJfdG9rZW4AAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAOdG9rZW5fY29udHJhY3QAAAAAABMAAAAA",
        "AAAAAAAAAIFSZXRvcm5hIHRvZG9zIG9zIHRva2VucyByZWdpc3RyYWRvcyBxdWUgdW0gdXN1w6FyaW8gcG9zc3VpIGUgc2V1cyBkYWRvcyBiw6FzaWNvcy4KRXN0YSBmdW7Dp8OjbyBzZXLDoSB1c2FkYSBwZXNhZGFtZW50ZSBwZWxvIFNESy4AAAAAAAATZ2V0X3VzZXJfcmVwdXRhdGlvbgAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPsAAAAEQAAAAY=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_signer: this.txFromJSON<string>,
        initialize: this.txFromJSON<null>,
        update_signer: this.txFromJSON<null>,
        register_token: this.txFromJSON<null>,
        get_user_reputation: this.txFromJSON<Map<string, u64>>
  }
}