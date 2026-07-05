import { HybridCryptoService } from './hybridCrypto.js';
import logger from '../config/logger.js';

async function testCryptoCompatibility() {
  logger.info('=== Cryptography Module Verification (JS) ===');
  
  const cryptoService = HybridCryptoService.getInstance();
  await cryptoService.init();

  const instruction = {
    senderVpa: 'alice@demo',
    receiverVpa: 'bob@demo',
    amount: 150.75,
    pinHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    nonce: '00000000-0000-0000-0000-000000000000',
    signedAt: 1712345678900,
  };

  logger.info('Original Payload: ' + JSON.stringify(instruction));

  // Encrypt
  const publicKeyPem = cryptoService.getPublicKeyPem();
  const ciphertext = await cryptoService.encrypt(instruction, publicKeyPem);
  logger.info(`Encrypted Base64 Payload Length: ${ciphertext.length}`);
  logger.info(`Ciphertext Preview: ${ciphertext.substring(0, 80)}...`);

  // Hash check
  const hash = cryptoService.hashCiphertext(ciphertext);
  logger.info(`Idempotency Hash (SHA-256): ${hash}`);

  // Decrypt
  const decrypted = await cryptoService.decrypt(ciphertext);
  logger.info('Decrypted Payload: ' + JSON.stringify(decrypted));

  // Validation
  const success =
    decrypted.senderVpa === instruction.senderVpa &&
    decrypted.receiverVpa === instruction.receiverVpa &&
    decrypted.amount === instruction.amount &&
    decrypted.pinHash === instruction.pinHash &&
    decrypted.nonce === instruction.nonce &&
    decrypted.signedAt === instruction.signedAt;

  if (success) {
    logger.info('SUCCESS: Encryption and Decryption are fully operational in JavaScript!');
  } else {
    logger.error('FAILURE: Decrypted data does not match original payload.');
    process.exit(1);
  }
}

testCryptoCompatibility().catch((err) => {
  logger.error('Crypto test crashed:', err);
  process.exit(1);
});
