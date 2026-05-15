import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdentityService } from '../../src/services/IdentityService';
import { PasskeyManager } from '../../src/identity/PasskeyManager';
import { TransactionBroadcaster } from '../../src/tx/Broadcaster';
import * as Encryption from '../../src/identity/Encryption';
import * as SoulRecovery from '../../src/identity/SoulRecovery';
import { Buffer } from 'buffer';

vi.mock('../../src/identity/PasskeyManager');
vi.mock('../../src/tx/Broadcaster');
vi.mock('../../src/identity/Encryption');
vi.mock('../../src/identity/SoulRecovery');

describe('IdentityService.importAndMigrate', () => {
  let identityService: IdentityService;
  let mockPasskeyManager: any;
  let mockBroadcaster: any;
  const config = {
    soulContractId: 'SOUL_CONTRACT',
    registryContractId: 'REG_CONTRACT',
    appName: 'TestApp',
    networkPassphrase: 'TestNetwork',
    rpcUrl: 'http://localhost',
    allowHttp: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPasskeyManager = new PasskeyManager({} as any);
    mockBroadcaster = new TransactionBroadcaster([] as any, {} as any);
    identityService = new IdentityService(mockPasskeyManager, mockBroadcaster, config);
    
    // Mock getSoulClient
    (identityService as any).getSoulClient = vi.fn().mockReturnValue({
      get_soul: vi.fn().mockResolvedValue({ result: { passkey: Buffer.from('old-pk') } }),
      recover_soul: vi.fn().mockResolvedValue({ transaction: 'mock-tx' }),
    });
  });

  it('should successfully migrate identity', async () => {
    const mockBackup = {
      soulId: 123,
      vault: { version: '1' }
    };
    const password = 'pass';
    const mockRecoverySeed = new Uint8Array([1, 2, 3]);
    const mockNewRegistration = { publicKeyHex: 'aabbcc', contractId: 'NEW_ADDR' };
    const mockSignature = Buffer.from('sig');

    vi.spyOn(Encryption, 'decryptKey').mockResolvedValue(mockRecoverySeed);
    mockPasskeyManager.createIdentity.mockResolvedValue(mockNewRegistration);
    vi.spyOn(SoulRecovery, 'signSoulRecovery').mockReturnValue(mockSignature);
    vi.spyOn(SoulRecovery, 'deriveRecoveryPublicKey').mockReturnValue(new Uint8Array([4, 5, 6]));
    mockBroadcaster.broadcast.mockResolvedValue({ status: 'SUCCESS', hash: 'TX_HASH' });

    const session = await identityService.importAndMigrate(mockBackup, password);

    expect(Encryption.decryptKey).toHaveBeenCalledWith(mockBackup.vault, password);
    expect(mockPasskeyManager.createIdentity).toHaveBeenCalledWith(config.appName);
    expect(SoulRecovery.signSoulRecovery).toHaveBeenCalled();
    expect(mockBroadcaster.broadcast).toHaveBeenCalledWith('mock-tx');
    
    expect(session.soulId).toBe('123');
    expect(session.address).toBe('NEW_ADDR');
    expect(session.txHash).toBe('TX_HASH');
  });

  it('should throw error if soul not found', async () => {
    (identityService as any).getSoulClient = vi.fn().mockReturnValue({
      get_soul: vi.fn().mockResolvedValue({ result: null }),
    });

    const mockBackup = { soulId: 123, vault: { version: '1' } };
    vi.spyOn(Encryption, 'decryptKey').mockResolvedValue(new Uint8Array([1,2,3]));
    mockPasskeyManager.createIdentity.mockResolvedValue({ publicKeyHex: 'abc' });

    await expect(identityService.importAndMigrate(mockBackup, 'pass'))
      .rejects.toThrow('Soul not found for soulId=123');
  });

  it('should throw error if broadcast fails', async () => {
    const mockBackup = { soulId: 123, vault: { version: '1' } };
    vi.spyOn(Encryption, 'decryptKey').mockResolvedValue(new Uint8Array([1,2,3]));
    mockPasskeyManager.createIdentity.mockResolvedValue({ publicKeyHex: 'abc', contractId: 'C1' });
    (identityService as any).getSoulClient = vi.fn().mockReturnValue({
      get_soul: vi.fn().mockResolvedValue({ result: { passkey: Buffer.from('old') } }),
      recover_soul: vi.fn().mockResolvedValue({ transaction: 'tx' }),
    });
    mockBroadcaster.broadcast.mockResolvedValue({ status: 'FAILED' });

    await expect(identityService.importAndMigrate(mockBackup, 'pass'))
      .rejects.toThrow('Migration broadcast failed: FAILED');
  });
});
