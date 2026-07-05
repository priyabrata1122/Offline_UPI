import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
  {
    vpa: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    holderName: {
      type: String,
      required: true,
    },
    balance: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export const Account = mongoose.model('Account', AccountSchema);
export default Account;
