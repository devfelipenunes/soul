import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZolvencySDK } from '../../src/index';
import { IdentityService } from '../../src/services/IdentityService';

vi.mock('../../src/services/IdentityService');

describe('Portability - Import & Migration', () => {
  let sdk: ZolvencySDK;
  
  beforeEach(() => {
    vi.clearAllMocks();
    sdk = new ZolvencySDK();
  });

  it('should call importAndMigrate on IdentityService when importIdentity is called', async () => {
    const mockBackup: any = {
      soulId: 1,
      address: 'G...',
      vault: { version: '1', salt: 's', iv: 'i', ciphertext: 'c' }
    };
    const password = 'test-password';
    const mockSession: any = {
      soulId: '1',
      address: 'G_NEW',
      txHash: '0x123'
    };

    const importAndMigrateMock = vi.fn().mockResolvedValue(mockSession);
    (sdk.identity as any).importAndMigrate = importAndMigrateMock;

    const result = await sdk.importIdentity(mockBackup, password);

    expect(importAndMigrateMock).toHaveBeenCalledWith(mockBackup, password);
    expect(result).toEqual(mockSession);
    expect(sdk.getAddress()).toBe('G_NEW');
  });
});
