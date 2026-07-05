import React, { useState } from 'react';
import { Shield, Sliders, ToggleLeft, ToggleRight, Key } from 'lucide-react';

export const SettingsPage = () => {
  const [gossipInterval, setGossipInterval] = useState('60');
  const [ttlHops, setTtlHops] = useState('5');
  const [autoFlush, setAutoFlush] = useState(true);
  const [pinProtection, setPinProtection] = useState(true);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-400" /> Wallet Settings
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Tune your simulated Bluetooth gossip limits, TTL counts, and packet timers.
        </p>
      </div>

      {/* Settings Form */}
      <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-2">
          <Shield className="w-4.5 h-4.5 text-indigo-400" /> Mesh parameters
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Virtual Gossip Advertising Interval (seconds)
            </label>
            <input
              type="number"
              value={gossipInterval}
              onChange={(e) => setGossipInterval(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Default Packet Time-to-Live (hops)
            </label>
            <input
              type="number"
              value={ttlHops}
              onChange={(e) => setTtlHops(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm">
            <span className="text-gray-300 font-semibold">Auto-Flush Bridges (Simulator only)</span>
            <button
              onClick={() => setAutoFlush(!autoFlush)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {autoFlush ? (
                <ToggleRight className="w-8 h-8 text-indigo-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-500" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm">
            <span className="text-gray-300 font-semibold">Enforce Local PIN Validation</span>
            <button
              onClick={() => setPinProtection(!pinProtection)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {pinProtection ? (
                <ToggleRight className="w-8 h-8 text-indigo-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
