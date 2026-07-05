import * as crypto from 'crypto';
import { Account } from '../models/Account.js';
import { HybridCryptoService } from '../crypto/hybridCrypto.js';
import logger from '../config/logger.js';

export class DemoService {
  static instance;

  cryptoService = HybridCryptoService.getInstance();

  constructor() {}

  static getInstance() {
    if (!DemoService.instance) {
      DemoService.instance = new DemoService();
    }
    return DemoService.instance;
  }

  async seedAccounts() {
    const count = await Account.countDocuments();
    if (count === 0) {
      await Account.create([
        { vpa: 'alice@demo', holderName: 'Alice', balance: 5000.0 },
        { vpa: 'bob@demo', holderName: 'Bob', balance: 1000.0 },
        { vpa: 'carol@demo', holderName: 'Carol', balance: 2500.0 },
        { vpa: 'dave@demo', holderName: 'Dave', balance: 500.0 },
      ]);
      logger.info('Seeded 4 demo accounts (Alice, Bob, Carol, Dave)');
    }
  }

  async createPacket(senderVpa, receiverVpa, amount, pin, ttl) {
    const pinHash = this.sha256Hex(pin);
    const nonce = crypto.randomUUID();
    const signedAt = Date.now();

    const instruction = {
      senderVpa,
      receiverVpa,
      amount,
      pinHash,
      nonce,
      signedAt,
    };

    const serverPublicKey = this.cryptoService.getPublicKeyPem();
    const ciphertext = await this.cryptoService.encrypt(instruction, serverPublicKey);

    const packet = {
      packetId: crypto.randomUUID(),
      ttl,
      createdAt: Date.now(),
      ciphertext,
    };

    return packet;
  }

  sha256Hex(input) {
    return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
  }
}
export default DemoService;
