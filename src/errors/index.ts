export class ZolvencyError extends Error {
  constructor(message: string) {
    super(`[ZolvencySDK] ${message}`);
    this.name = "ZolvencyError";
  }
}

export class HubConnectionError extends ZolvencyError {
  constructor(details: string) {
    super(`Failed to connect to Zolvency Hub: ${details}`);
    this.name = "HubConnectionError";
  }
}

export class ReputationLockedError extends ZolvencyError {
  constructor(user: string) {
    super(`Reputation for user ${user} is currently locked by another protocol.`);
    this.name = "ReputationLockedError";
  }
}

export class ContractCallError extends ZolvencyError {
  constructor(details: string) {
    super(`Contract call failed: ${details}`);
    this.name = "ContractCallError";
  }
}

export class ContractResultError extends ZolvencyError {
  constructor(details: string) {
    super(`Contract returned error: ${details}`);
    this.name = "ContractResultError";
  }
}

export class UnsupportedContractMethodError extends ZolvencyError {
  constructor(method: string) {
    super(`Contract method not available in bindings: ${method}`);
    this.name = "UnsupportedContractMethodError";
  }
}
