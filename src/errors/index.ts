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
