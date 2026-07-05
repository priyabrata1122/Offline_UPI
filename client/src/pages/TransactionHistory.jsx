import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowDownLeft, ArrowUpRight, Clock, RefreshCw } from 'lucide-react';

export const TransactionHistory = () => {
  const { api, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/transactions');
      // Filter for current user's VPA
      const userTxs = response.data.filter(
        (t) => t.senderVpa === user?.vpa || t.receiverVpa === user?.vpa
      );
      setTransactions(userTxs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction Ledger</h2>
          <p className="text-sm text-gray-400 mt-1">
            Settlement records containing proof-of-work hashes and hops audit logs.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Ledger Table */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 font-semibold">
            Decrypting ledger logs...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">
            No transactions found on this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="p-4">Type</th>
                  <th className="p-4">Counterparty VPA</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Signed Date</th>
                  <th className="p-4 font-mono">Packet Hash</th>
                  <th className="p-4 text-center">Hops</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {transactions.map((tx) => {
                  const isSender = tx.senderVpa === user?.vpa;
                  const counterparty = isSender ? tx.receiverVpa : tx.senderVpa;
                  const formattedDate = new Date(tx.signedAt).toLocaleString();

                  return (
                    <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        {isSender ? (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Outgoing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Incoming
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-200">{counterparty}</td>
                      <td className={`p-4 font-extrabold ${isSender ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isSender ? '-' : '+'}₹
                        {tx.amount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-4 text-gray-400 text-xs">{formattedDate}</td>
                      <td className="p-4 font-mono text-[10px] text-gray-500" title={tx.packetHash}>
                        {tx.packetHash.substring(0, 16)}...
                      </td>
                      <td className="p-4 text-center text-gray-300 font-semibold">{tx.hopCount}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            tx.status === 'SETTLED'
                              ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/15 border border-red-500/20 text-red-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
