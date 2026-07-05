import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet as WalletIcon,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Lock,
  CheckCircle,
} from 'lucide-react';

export const Wallet = () => {
  const { api, user } = useAuth();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletDetails = async () => {
    try {
      if (user) {
        const accRes = await api.get('/api/accounts');
        const myAcc = accRes.data.find((a) => a.vpa === user.vpa);
        setAccount(myAcc || null);

        const txRes = await api.get('/api/transactions');
        const myTxs = txRes.data.filter(
          (t) => t.senderVpa === user.vpa || t.receiverVpa === user.vpa
        );
        setTransactions(myTxs);
      }
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, [user]);

  const totalSpent = transactions
    .filter((t) => t.senderVpa === user?.vpa && t.status === 'SETTLED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.receiverVpa === user?.vpa && t.status === 'SETTLED')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <div>
          <h2 className="text-2xl font-bold text-white">My Cryptographic Wallet</h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage your VPA account, key statistics, and ledger logs.
          </p>
        </div>
        <button
          onClick={fetchWalletDetails}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-900/20 via-transparent to-transparent">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <WalletIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Account Balance
          </span>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            ₹{(account?.balance || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h3>
          <p className="text-xs text-indigo-400 mt-2 font-mono truncate">{user?.vpa}</p>
        </div>

        {/* Total Outflow */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
            <ArrowUpRight className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Total Settled Outflow
          </span>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            ₹{totalSpent.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h3>
          <p className="text-xs text-red-400 mt-2 font-semibold flex items-center gap-1">
            Debit ledger settling
          </p>
        </div>

        {/* Total Inflow */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Total Settled Inflow
          </span>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            ₹{totalReceived.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h3>
          <p className="text-xs text-emerald-400 mt-2 font-semibold">
            Credit ledger settling
          </p>
        </div>
      </div>

      {/* Trust & Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-2">
            <Shield className="w-4.5 h-4.5 text-indigo-400" /> Security Specifications
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Ledger Currency:</span>
              <span className="text-white font-semibold font-mono">INR (₹)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cryptographic Standard:</span>
              <span className="text-white font-semibold">RSA-2048 & AES-256-GCM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Authorization Scheme:</span>
              <span className="text-white font-semibold">Offline PIN Signature (SHA-256)</span>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-2">
            <Lock className="w-4.5 h-4.5 text-purple-400" /> Key Credentials
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Holder Name:</span>
              <span className="text-white font-semibold">{account?.holderName || user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VPA Address:</span>
              <span className="text-indigo-400 font-semibold font-mono">{user?.vpa}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Activated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
