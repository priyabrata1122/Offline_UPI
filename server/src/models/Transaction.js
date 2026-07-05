import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    packetHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    senderVpa: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    receiverVpa: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    signedAt: {
      type: Date,
      required: true,
    },
    settledAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    bridgeNodeId: {
      type: String,
      required: true,
    },
    hopCount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['SETTLED', 'REJECTED'],
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;
