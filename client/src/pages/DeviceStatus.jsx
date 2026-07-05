import React from 'react';
import { Activity, ShieldAlert, Cpu, BatteryCharging, CheckCircle } from 'lucide-react';

export const DeviceStatus = () => {
  const hardwareMetrics = [
    { name: 'Gossip Service Daemon', status: 'Active', color: 'text-emerald-400' },
    { name: 'BLE Broadcast Transmitter', status: 'Advertising', color: 'text-indigo-400' },
    { name: 'Hardware Cryptography Engine', status: 'Enclave Ready', color: 'text-emerald-400' },
    { name: 'Packet Storage Buffer', status: 'Optimal (0.01% used)', color: 'text-emerald-400' },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-400" /> Device Diagnostics
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Monitor your local node hardware stats, peripheral status, and crypt-enclave status.
        </p>
      </div>

      {/* Main card */}
      <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Node Hardware Specs</h3>
            <span className="text-xs text-gray-400">Node Identifier: local-ble-mobile-terminal</span>
          </div>
        </div>

        {/* Diagnostic Items */}
        <div className="space-y-4">
          {hardwareMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm"
            >
              <span className="text-gray-300 font-semibold">{metric.name}</span>
              <span className={`font-bold ${metric.color}`}>{metric.status}</span>
            </div>
          ))}

          {/* Battery Status Mock */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm">
            <span className="text-gray-300 font-semibold flex items-center gap-1.5">
              <BatteryCharging className="w-4 h-4 text-emerald-400" /> Transmitter Battery
            </span>
            <span className="text-emerald-400 font-bold">94%</span>
          </div>
        </div>

        {/* Global Node status check */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          <span>All hardware systems operational. Secure enclave validation success.</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceStatus;
