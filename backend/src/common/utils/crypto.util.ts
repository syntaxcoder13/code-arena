import * as crypto from 'node:crypto';

/**
 * AES-256-GCM field encryption utility for sensitive data at rest (e.g. OAuth tokens).
 */
export class CryptoUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits recommended for GCM

  private static getKey(secret?: string): Buffer {
    const configured = secret || process.env.ENCRYPTION_KEY;
    if (!configured && process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY is required in production to encrypt OAuth tokens at rest');
    }
    const rawKey = configured || 'opensourcehub_default_aes_key_32_bytes!';
    // Derive a 32-byte key using SHA-256 if the provided key is not exactly 32 bytes
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext into a formatted string: "ivHex:authTagHex:ciphertextHex"
   */
  public static encrypt(plaintext: string, secret?: string): string {
    if (!plaintext) return '';
    const key = this.getKey(secret);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts formatted string back to plaintext.
   * If decryption fails or string is not encrypted, returns empty string or fallback.
   */
  public static decrypt(cipherTextWithMeta: string, secret?: string): string {
    if (!cipherTextWithMeta) return '';
    const parts = cipherTextWithMeta.split(':');
    if (parts.length !== 3) {
      // Legacy plaintext fallback
      return cipherTextWithMeta;
    }

    try {
      const [ivHex, authTagHex, encryptedHex] = parts;
      const key = this.getKey(secret);
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('Failed to decrypt token:', err);
      return '';
    }
  }
}
