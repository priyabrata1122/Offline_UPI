import mongoose from 'mongoose';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import logger from '../config/logger.js';

export class SettlementService {
  static instance;

  constructor() {}

  static getInstance() {
    if (!SettlementService.instance) {
      SettlementService.instance = new SettlementService();
    }
    return SettlementService.instance;
  }

  async settle(instruction, packetHash, bridgeNodeId, hopCount) {
    const session = await mongoose.startSession().catch(() => null);

    if (session) {
      try {
        let resultTx;
        await session.withTransaction(async () => {
          const sender = await Account.findOne({ vpa: instruction.senderVpa }).session(session);
          if (!sender) {
            throw new Error(`Unknown sender VPA: ${instruction.senderVpa}`);
          }

          const receiver = await Account.findOne({ vpa: instruction.receiverVpa }).session(session);
          if (!receiver) {
            throw new Error(`Unknown receiver VPA: ${instruction.receiverVpa}`);
          }

          const amount = instruction.amount;
          if (amount <= 0) {
            throw new Error('Amount must be positive');
          }

          if (sender.balance < amount) {
            logger.warn(
              `Insufficient balance (Tx): ${sender.vpa} has ₹${sender.balance}, tried to send ₹${amount}`
            );
            resultTx = await this.recordRejected(instruction, packetHash, bridgeNodeId, hopCount, session);
            return;
          }

          // Update balances
          sender.balance = parseFloat((sender.balance - amount).toFixed(2));
          receiver.balance = parseFloat((receiver.balance + amount).toFixed(2));

          await sender.save({ session });
          await receiver.save({ session });

          const tx = new Transaction({
            packetHash,
            senderVpa: instruction.senderVpa,
            receiverVpa: instruction.receiverVpa,
            amount,
            signedAt: new Date(instruction.signedAt),
            settledAt: new Date(),
            bridgeNodeId,
            hopCount,
            status: 'SETTLED',
          });

          resultTx = await tx.save({ session });

          logger.info(
            `SETTLED ₹${amount} from ${sender.vpa} to ${receiver.vpa} (packetHash=${packetHash.substring(
              0,
              12
            )}..., bridge=${bridgeNodeId}, hops=${hopCount})`
          );
        });

        return resultTx;
      } catch (err) {
        logger.error(`Transaction aborted: ${err.message}`);
        throw err;
      } finally {
        await session.endSession();
      }
    } else {
      // Fallback
      logger.warn('Transactions not supported by MongoDB environment. Performing fallback operations...');
      const sender = await Account.findOne({ vpa: instruction.senderVpa });
      if (!sender) {
        throw new Error(`Unknown sender VPA: ${instruction.senderVpa}`);
      }

      const receiver = await Account.findOne({ vpa: instruction.receiverVpa });
      if (!receiver) {
        throw new Error(`Unknown receiver VPA: ${instruction.receiverVpa}`);
      }

      const amount = instruction.amount;
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      if (sender.balance < amount) {
        logger.warn(
          `Insufficient balance (Fallback): ${sender.vpa} has ₹${sender.balance}, tried to send ₹${amount}`
        );
        return this.recordRejected(instruction, packetHash, bridgeNodeId, hopCount);
      }

      sender.balance = parseFloat((sender.balance - amount).toFixed(2));
      receiver.balance = parseFloat((receiver.balance + amount).toFixed(2));

      await sender.save();
      await receiver.save();

      const tx = new Transaction({
        packetHash,
        senderVpa: instruction.senderVpa,
        receiverVpa: instruction.receiverVpa,
        amount,
        signedAt: new Date(instruction.signedAt),
        settledAt: new Date(),
        bridgeNodeId,
        hopCount,
        status: 'SETTLED',
      });

      const resultTx = await tx.save();

      logger.info(
        `SETTLED (Fallback) ₹${amount} from ${sender.vpa} to ${receiver.vpa} (packetHash=${packetHash.substring(
          0,
          12
        )}..., bridge=${bridgeNodeId}, hops=${hopCount})`
      );

      return resultTx;
    }
  }

  async recordRejected(instruction, packetHash, bridgeNodeId, hopCount, session = null) {
    const tx = new Transaction({
      packetHash,
      senderVpa: instruction.senderVpa,
      receiverVpa: instruction.receiverVpa,
      amount: instruction.amount,
      signedAt: new Date(instruction.signedAt),
      settledAt: new Date(),
      bridgeNodeId,
      hopCount,
      status: 'REJECTED',
    });

    return tx.save(session ? { session } : {});
  }
}
export default SettlementService;
