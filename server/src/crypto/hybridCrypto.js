import * as crypto from 'crypto';
import { promisify } from 'util';
import logger from '../config/logger.js';

const generateKeyPairAsync = promisify(crypto.generateKeyPair);

export class HybridCryptoService {
  static instance;
  publicKey;
  privateKey;

  constructor() {}

  static getInstance() {
    if (!HybridCryptoService.instance) {
      HybridCryptoService.instance = new HybridCryptoService();
    }
    return HybridCryptoService.instance;
  }

  /**
   * Initializes the RSA Key Pair.
   */
  async init() {
    try {
      const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      this.publicKey = publicKey;
      this.privateKey = privateKey;

      const fingerprint = this.getPublicKeyBase64().substring(0, 32) + '...';
      logger.info(`Server RSA keypair generated (2048-bit). Public key fingerprint: ${fingerprint}`);
    } catch (error) {
      logger.error('Failed to generate server RSA keypair:', error);
      throw error;
    }
  }

  getPublicKeyPem() {
    return this.publicKey;
  }

  getPrivateKeyPem() {
    return this.privateKey;
  }

  getPublicKeyBase64() {
    return this.publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s+/g, '');
  }

  /**
   * Hybrid encrypts a payment instruction using a public key.
   */
  async encrypt(instruction, publicKeyPem) {
    const plaintext = Buffer.from(JSON.stringify(instruction), 'utf8');

    // 1. Generate one-time 256-bit AES key.
    const aesKey = crypto.randomBytes(32); // 256 bits

    // 2. Generate 12-byte GCM IV.
    const iv = crypto.randomBytes(12);

    // 3. Encrypt payload with AES-256-GCM.
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let ciphertext = cipher.update(plaintext);
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    const tag = cipher.getAuthTag(); // 16 bytes

    // Concatenate ciphertext and tag
    const aesCiphertextWithTag = Buffer.concat([ciphertext, tag]);

    // 4. Encrypt AES key using RSA-OAEP.
    const encryptedAesKey = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    );

    // 5. Pack
    const packedBuffer = Buffer.concat([encryptedAesKey, iv, aesCiphertextWithTag]);

    return packedBuffer.toString('base64');
  }

  /**
   * Decrypts a base64 ciphertext packet using the server's private key.
   */
  async decrypt(base64Ciphertext) {
    const all = Buffer.from(base64Ciphertext, 'base64');
    const RSA_ENCRYPTED_KEY_BYTES = 256;
    const GCM_IV_BYTES = 12;
    const GCM_TAG_BYTES = 16;

    if (all.length < RSA_ENCRYPTED_KEY_BYTES + GCM_IV_BYTES + GCM_TAG_BYTES) {
      throw new Error('Ciphertext too short');
    }

    // Unpack
    const encryptedAesKey = all.subarray(0, RSA_ENCRYPTED_KEY_BYTES);
    const iv = all.subarray(RSA_ENCRYPTED_KEY_BYTES, RSA_ENCRYPTED_KEY_BYTES + GCM_IV_BYTES);
    const aesCiphertextWithTag = all.subarray(RSA_ENCRYPTED_KEY_BYTES + GCM_IV_BYTES);

    // 1. RSA-decrypt the AES session key
    const aesKeyBytes = crypto.privateDecrypt(
      {
        key: this.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedAesKey
    );

    // 2. Separate ciphertext and tag
    const ciphertext = aesCiphertextWithTag.subarray(0, aesCiphertextWithTag.length - GCM_TAG_BYTES);
    const tag = aesCiphertextWithTag.subarray(aesCiphertextWithTag.length - GCM_TAG_BYTES);

    // 3. Decrypt payload with AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKeyBytes, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  hashCiphertext(base64Ciphertext) {
    return crypto
      .createHash('sha256')
      .update(base64Ciphertext, 'utf8')
      .digest('hex');
  }
}
export default HybridCryptoService;
