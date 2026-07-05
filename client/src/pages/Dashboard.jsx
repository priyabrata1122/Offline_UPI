import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Signal,
  Wifi,
  WifiOff,
  Cpu,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

export const Dashboard = () => {
  const { api, user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [meshState, setMeshState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [autoGossip, setAutoGossip] = useState(false);

  const addLog = (message, type = 'info') => {
    setLogs((prev) => [
      { text: `[${new Date().toLocaleTimeString()}] ${message}`, type, id: Math.random() },
      ...prev.slice(0, 49),
    ]);
  };

  const fetchDashboardData = async () => {
    try {
      if (user) {
        const accRes = await api.get('/api/accounts');
        const myAccount = accRes.data.find((a) => a.vpa === user.vpa);
        if (myAccount) {
          setBalance(myAccount.balance);
        }
      }

      const meshRes = await api.get('/api/mesh/state');
      setMeshState(meshRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      addLog('Error querying network mesh state', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    addLog('Virtual bluetooth mesh telemetry channel opened.');
  }, [user]);

  // Auto gossip tick
  useEffect(() => {
    if (!autoGossip) return;
    const interval = setInterval(async () => {
      try {
        const response = await api.post('/api/mesh/gossip');
        const { transfers } = response.data;
        if (transfers > 0) {
          addLog(`Gossip tick: gossiped ${transfers} packet copies across devices.`, 'gossip');
          fetchDashboardData();
        }
      } catch (error) {
        addLog('Gossip round tick failed', 'error');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [autoGossip]);

  const handleSingleGossip = async () => {
    try {
      const response = await api.post('/api/mesh/gossip');
      const { transfers } = response.data;
      addLog(`Manual gossip completed: ${transfers} packet hops transferred.`);
      fetchDashboardData();
    } catch (error) {
      addLog('Failed to gossip', 'error');
    }
  };

  const handleFlush = async () => {
    try {
      addLog('Initiating internet upload check for bridge devices...');
      const response = await api.post('/api/mesh/flush');
      const { results, uploadsAttempted } = response.data;

      addLog(`Bridges discovered: Uploaded ${uploadsAttempted} packet settles.`);

      results.forEach((res) => {
        if (res.outcome === 'SETTLED') {
          addLog(`SUCCESS: Tx settled! Hash: ${res.packetId}... via ${res.bridgeNode}`, 'success');
        } else if (res.outcome === 'DUPLICATE_DROPPED') {
          addLog(`Dropped duplicate packet ${res.packetId}... on server.`, 'warning');
        } else {
          addLog(`REJECTED: Tx ${res.packetId}... rejected. Reason: ${res.reason}`, 'error');
        }
      });

      fetchDashboardData();
    } catch (error) {
      addLog('Failed to flush bridge uploads', 'error');
    }
  };

  const handleReset = async () => {
    try {
      await api.post('/api/mesh/reset');
      addLog('Reset all simulator device memory buffers and clear idempotency server index.', 'warning');
      fetchDashboardData();
    } catch (error) {
      addLog('Reset failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Telemetry Dashboard
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Real-time status of simulated offline Bluetooth Low Energy (BLE) gossip network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5"
            title="Refresh State"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/10 flex items-center gap-2 text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" /> Reset Simulator
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-indigo-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Available Wallet Balance
          </span>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Direct settlement ledger
          </p>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Signal className="w-24 h-24 text-indigo-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Simulator Hop Nodes
          </span>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            {meshState?.devices?.length || 0} Nodes
          </h3>
          <p className="text-xs text-indigo-400 font-semibold mt-2">
            1 Offline Sender, 3 Hops, 1 Online Gateway Bridge
          </p>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cpu className="w-24 h-24 text-indigo-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Server Idempotency Size
          </span>
          <h3 className="text-3xl font-extrabold text-white mt-2">
            {meshState?.idempotencyCacheSize || 0} Hashes
          </h3>
          <p className="text-xs text-gray-400 mt-2">
            Ensures double-spend protection for duplicate packets.
          </p>
        </div>
      </div>

      {/* Simulator Control and Devices Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gossip Controls & Devices List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-bold text-lg text-white">Virtual Mesh Network</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoGossip(!autoGossip)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    autoGossip
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${autoGossip ? 'fill-current animate-pulse' : ''}`} />
                  {autoGossip ? 'Auto-Gossip ON' : 'Auto-Gossip OFF'}
                </button>
                <button
                  onClick={handleSingleGossip}
                  disabled={autoGossip}
                  className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Gossip Once
                </button>
                <button
                  onClick={handleFlush}
                  className="px-4 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold transition-colors"
                >
                  Flush Bridges
                </button>
              </div>
            </div>

            {/* Devices Grid representation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {meshState?.devices?.map((dev) => (
                <div
                  key={dev.deviceId}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-200 truncate pr-2">
                      {dev.deviceId.replace('phone-', '')}
                    </span>
                    {dev.hasInternet ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1">
                        <WifiOff className="w-3 h-3" /> Offline
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Held Packets
                    </span>
                    <div className="text-xl font-extrabold text-white mt-1">
                      {dev.packetCount}
                    </div>
                  </div>

                  {/* Micro packet tags */}
                  {dev.packetIds.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {dev.packetIds.slice(0, 2).map((pid, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[8px] font-mono"
                        >
                          {pid}
                        </span>
                      ))}
                      {dev.packetIds.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 text-[8px]">
                          +{dev.packetIds.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Activity Telemetry Log */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[400px]">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm border-b border-white/5 pb-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Mesh Activity Logs
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] pr-2 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 italic">
                No activity detected. Broadcast a transaction to begin.
              </div>
            ) : (
              logs.map((log) => {
                let colorClass = 'text-gray-400';
                if (log.type === 'success') colorClass = 'text-emerald-400 font-semibold';
                if (log.type === 'error') colorClass = 'text-red-400 font-semibold';
                if (log.type === 'warning') colorClass = 'text-yellow-400';
                if (log.type === 'gossip') colorClass = 'text-indigo-400';

                return (
                  <div key={log.id} className={`p-2 rounded bg-white/5 ${colorClass} border-l-2 border-white/10`}>
                    {log.text}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
