import { HybridCryptoService } from '../crypto/hybridCrypto.js';
import { IdempotencyService } from './IdempotencyService.js';
import { SettlementService } from './SettlementService.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

export class BridgeIngestionService {
  static instance;

  cryptoService = HybridCryptoService.getInstance();
  idempotencyService = IdempotencyService.getInstance();
  settlementService = SettlementService.getInstance();
  maxAgeSeconds = env.PACKET_MAX_AGE_SECONDS;

  constructor() {}

  static getInstance() {
    if (!BridgeIngestionService.instance) {
      BridgeIngestionService.instance = new BridgeIngestionService();
    }
    return BridgeIngestionService.instance;
  }

  async ingest(packet, bridgeNodeId, hopCount) {
    try {
      const packetHash = this.cryptoService.hashCiphertext(packet.ciphertext);

      // 1. Idempotency Check
      const isUnique = await this.idempotencyService.claim(packetHash);
      if (!isUnique) {
        logger.info(
          `DUPLICATE packet ${packetHash.substring(0, 12)}... from bridge ${bridgeNodeId} - dropped`
        );
        return {
          outcome: 'DUPLICATE_DROPPED',
          packetHash,
          reason: null,
          transactionId: null,
        };
      }

      // 2. Decrypt Ciphertext payload
      let instruction;
      try {
        instruction = await this.cryptoService.decrypt(packet.ciphertext);
      } catch (err) {
        logger.warn(`Decryption failed for packet ${packetHash.substring(0, 12)}...: ${err.message}`);
        return {
          outcome: 'INVALID',
          packetHash,
          reason: 'decryption_failed',
          transactionId: null,
        };
      }

      // 3. Freshness Check (Replay Protection)
      const ageSeconds = (Date.now() - instruction.signedAt) / 1000;
      if (ageSeconds > this.maxAgeSeconds) {
        logger.warn(`Packet ${packetHash.substring(0, 12)}... too old (${ageSeconds}s), rejected`);
        return {
          outcome: 'INVALID',
          packetHash,
          reason: 'stale_packet',
          transactionId: null,
        };
      }
      if (ageSeconds < -300) {
        logger.warn(`Packet ${packetHash.substring(0, 12)}... future dated (${ageSeconds}s), rejected`);
        return {
          outcome: 'INVALID',
          packetHash,
          reason: 'future_dated',
          transactionId: null,
        };
      }

      // 4. Ledger Settlement (Debit & Credit)
      const tx = await this.settlementService.settle(instruction, packetHash, bridgeNodeId, hopCount);

      return {
        outcome: tx.status === 'SETTLED' ? 'SETTLED' : 'INVALID',
        packetHash,
        reason: tx.status === 'REJECTED' ? 'insufficient_balance' : null,
        transactionId: String(tx._id),
      };
    } catch (err) {
      logger.error(`Ingestion error: ${err.message}`, err);
      return {
        outcome: 'INVALID',
        packetHash: '?',
        reason: `internal_error: ${err.message}`,
        transactionId: null,
      };
    }
  }
}
export default BridgeIngestionService;
