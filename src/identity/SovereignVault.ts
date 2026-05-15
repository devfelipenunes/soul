import { IdentityProfile } from "./SovereignProfile";
import { 
  EncryptedVault, 
  deriveKeyFromBuffer, 
  encryptData, 
  decryptData 
} from "./Encryption";
import { Buffer } from "buffer";

export class SovereignVault {
  /**
   * Encrypts an IdentityProfile using a passkeyHash.
   * 
   * @param profile The profile to encrypt
   * @param passkeyHash The biometric-linked key (Buffer)
   * @returns An EncryptedVault containing the encrypted profile
   */
  static async encryptProfile(
    profile: IdentityProfile, 
    passkeyHash: Buffer
  ): Promise<EncryptedVault> {
    const key = await deriveKeyFromBuffer(passkeyHash, ["encrypt"]);
    const profileJson = JSON.stringify(profile);
    const profileBytes = new TextEncoder().encode(profileJson);
    
    return await encryptData(profileBytes, key);
  }

  /**
   * Decrypts an IdentityProfile from an EncryptedVault using a passkeyHash.
   * 
   * @param vault The EncryptedVault containing the encrypted data
   * @param passkeyHash The biometric-linked key (Buffer)
   * @returns The decrypted IdentityProfile
   */
  static async decryptProfile(
    vault: EncryptedVault, 
    passkeyHash: Buffer
  ): Promise<IdentityProfile> {
    const key = await deriveKeyFromBuffer(passkeyHash, ["decrypt"]);
    const decryptedBytes = await decryptData(vault, key);
    const profileJson = new TextDecoder().decode(decryptedBytes);
    
    return JSON.parse(profileJson) as IdentityProfile;
  }
}
