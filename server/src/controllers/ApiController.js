import { HybridCryptoService } from '../crypto/hybridCrypto.js';
import { DemoService } from '../services/DemoService.js';
import { MeshSimulatorService } from '../services/MeshSimulatorService.js';
import { BridgeIngestionService } from '../services/BridgeIngestionService.js';
import { IdempotencyService } from '../services/IdempotencyService.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import logger from '../config/logger.js';

export class ApiController {
  static cryptoService = HybridCryptoService.getInstance();
  static demoService = DemoService.getInstance();
  static meshService = MeshSimulatorService.getInstance();
  static bridgeService = BridgeIngestionService.getInstance();
  static idempotencyService = IdempotencyService.getInstance();

  static getServerPublicKey(req, res) {
    res.json({
      publicKey: ApiController.cryptoService.getPublicKeyBase64(),
      algorithm: 'RSA-2048 / OAEP-SHA256',
      hybridScheme: 'RSA-OAEP encrypts an AES-256-GCM session key',
    });
  }

  static async demoSend(req, res) {
    try {
      const { senderVpa, receiverVpa, amount, pin, ttl, startDevice } = req.body;

      if (!senderVpa || !receiverVpa || !amount || !pin) {
        res.status(400).json({ success: false, message: 'Missing required parameters' });
        return;
      }

      const packetTtl = ttl !== undefined ? ttl : 5;
      const injectionPoint = startDevice || 'phone-alice';

      const packet = await ApiController.demoService.createPacket(
        senderVpa,
        receiverVpa,
        parseFloat(amount),
        pin,
        packetTtl
      );

      ApiController.meshService.inject(injectionPoint, packet);

      res.json({
        packetId: packet.packetId,
        ciphertextPreview: packet.ciphertext.substring(0, 64) + '...',
        ttl: packet.ttl,
        injectedAt: injectionPoint,
      });
    } catch (error) {
      logger.error('Error generating and injecting demo send packet:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async meshState(req, res) {
    try {
      const deviceData = ApiController.meshService.getDevices().map((d) => ({
        deviceId: d.getDeviceId(),
        hasInternet: d.hasInternet(),
        packetCount: d.packetCount(),
        packetIds: d.getHeldPackets().map((p) => p.packetId.substring(0, 8)),
      }));

      const cacheSize = await ApiController.idempotencyService.size();

      res.json({
        devices: deviceData,
        idempotencyCacheSize: cacheSize,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static meshGossip(req, res) {
    const result = ApiController.meshService.gossipOnce();
    res.json(result);
  }

  static async meshFlush(req, res) {
    try {
      const uploads = ApiController.meshService.collectBridgeUploads();
      const results = [];

      await Promise.all(
        uploads.map(async (up) => {
          const result = await ApiController.bridgeService.ingest(
            up.packet,
            up.bridgeNodeId,
            5 - up.packet.ttl
          );
          results.push({
            bridgeNode: up.bridgeNodeId,
            packetId: up.packet.packetId.substring(0, 8),
            outcome: result.outcome,
            reason: result.reason || '',
            transactionId: result.transactionId || -1,
          });
        })
      );

      res.json({
        uploadsAttempted: uploads.length,
        results,
      });
    } catch (error) {
      logger.error('Error during mesh flush processing:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async meshReset(req, res) {
    try {
      ApiController.meshService.resetMesh();
      await ApiController.idempotencyService.clear();
      res.json({ status: 'mesh and idempotency cache cleared' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async ingest(req, res) {
    try {
      const packet = req.body;
      const bridgeNodeId = String(req.headers['x-bridge-node-id'] || 'unknown');
      const hopCount = parseInt(String(req.headers['x-hop-count'] || '0'), 10);

      if (!packet || !packet.packetId || !packet.ciphertext) {
        res.status(400).json({ success: false, message: 'Invalid MeshPacket structure' });
        return;
      }

      const result = await ApiController.bridgeService.ingest(packet, bridgeNodeId, hopCount);
      res.json(result);
    } catch (error) {
      logger.error('Failed to ingest bridge packet:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listAccounts(req, res) {
    try {
      const accounts = await Account.find();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listTransactions(req, res) {
    try {
      const txs = await Transaction.find().sort({ settledAt: -1 }).limit(20);
      res.json(txs);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
export default ApiController;
