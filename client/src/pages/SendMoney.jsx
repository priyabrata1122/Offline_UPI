import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { encryptInstruction } from '../utils/crypto';
import {
  Send,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
} from 'lucide-react';

export const SendMoney = () => {
  const { api, user } = useAuth();

  const [receiverVpa, setReceiverVpa] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [startDevice, setStartDevice] = useState('phone-alice');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Please enter a valid positive amount.');
      }
      if (pin.length !== 4) {
        throw new Error('UPI PIN must be 4 digits.');
      }

      if (isOfflineMode) {
        // --- OFFLINE ROUTING SIMULATION ---
        // 1. Fetch server's public key
        const keyRes = await api.get('/api/server-key');
        const serverPublicKey = keyRes.data.publicKey;

        // 2. Client-side encrypt payment
        const rawPacket = {
          senderVpa: user.vpa,
          receiverVpa: receiverVpa.trim().toLowerCase(),
          amount: parsedAmount,
          signedAt: Date.now(),
        };

        // SHA-256 the PIN as a proof
        const pinBuffer = new TextEncoder().encode(pin);
        const pinHashBuffer = await window.crypto.subtle.digest('SHA-256', pinBuffer);
        const pinHashArray = Array.from(new Uint8Array(pinHashBuffer));
        const pinHash = pinHashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const instruction = {
          ...rawPacket,
          pinHash,
          nonce: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        };

        const ciphertext = await encryptInstruction(instruction, serverPublicKey);

        // 3. Assemble MeshPacket
        const meshPacket = {
          packetId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
          ttl: 5,
          createdAt: Date.now(),
          ciphertext,
        };

        // 4. Save to local storage queue
        const savedQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        savedQueue.push({
          id: meshPacket.packetId,
          receiverVpa: instruction.receiverVpa,
          amount: instruction.amount,
          createdAt: new Date().toISOString(),
          packet: meshPacket,
        });
        localStorage.setItem('offline_queue', JSON.stringify(savedQueue));

        // 5. Inject into mesh network simulator
        await api.post('/api/demo/send', {
          senderVpa: user.vpa,
          receiverVpa: instruction.receiverVpa,
          amount: instruction.amount,
          pin,
          ttl: 5,
          startDevice,
        });

        setSuccess({
          message: 'Offline transaction packet signed and broadcasted to mesh!',
          details: `Packet queued locally and injected into simulator node (${startDevice}). Hops remaining: 5.`,
        });
      } else {
        // --- ONLINE DIRECT ROUTING ---
        // Fetch server's public key
        const keyRes = await api.get('/api/server-key');
        const serverPublicKey = keyRes.data.publicKey;

        // Encrypt the payment
        const rawPacket = {
          senderVpa: user.vpa,
          receiverVpa: receiverVpa.trim().toLowerCase(),
          amount: parsedAmount,
          signedAt: Date.now(),
        };

        const pinBuffer = new TextEncoder().encode(pin);
        const pinHashBuffer = await window.crypto.subtle.digest('SHA-256', pinBuffer);
        const pinHashArray = Array.from(new Uint8Array(pinHashBuffer));
        const pinHash = pinHashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const instruction = {
          ...rawPacket,
          pinHash,
          nonce: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        };

        const ciphertext = await encryptInstruction(instruction, serverPublicKey);

        const meshPacket = {
          packetId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
          ttl: 5,
          createdAt: Date.now(),
          ciphertext,
        };

        // Post directly to ingest endpoint
        const response = await api.post(
          '/api/bridge/ingest',
          meshPacket,
          {
            headers: {
              'X-Bridge-Node-Id': 'phone-direct-online',
              'X-Hop-Count': 0,
            },
          }
        );

        if (response.data.outcome === 'SETTLED') {
          setSuccess({
            message: `Transaction Settled Successfully!`,
            details: `Settled amount of ₹${parsedAmount.toFixed(2)} to ${receiverVpa}. Transaction ID: ${
              response.data.transactionId
            }`,
          });
        } else {
          setError(
            response.data.reason === 'insufficient_balance'
              ? 'Transaction rejected: Insufficient ledger balance.'
              : `Transaction failed: ${response.data.reason || response.data.outcome}`
          );
        }
      }
    } catch (err) {
      setError(err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Send className="w-6 h-6 text-indigo-400" /> Send Money
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Perform a direct online settlement or sign a local gossip mesh transaction offline.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{success.message}</p>
            <p className="text-xs mt-1 text-emerald-400/80">{success.details}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border border-white/5 space-y-5">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/5">
          <button
            type="button"
            onClick={() => setIsOfflineMode(false)}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !isOfflineMode ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wifi className="w-4 h-4" /> Online Direct
          </button>
          <button
            type="button"
            onClick={() => setIsOfflineMode(true)}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isOfflineMode ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <WifiOff className="w-4 h-4" /> Offline Mesh
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Receiver VPA
            </label>
            <input
              type="text"
              required
              value={receiverVpa}
              onChange={(e) => setReceiverVpa(e.target.value)}
              placeholder="username@demo"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-gray-400" /> UPI PIN (4 Digits)
            </label>
            <input
              type="password"
              maxLength={4}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm tracking-widest font-bold text-center"
            />
          </div>

          {isOfflineMode && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Inject Simulator Start Node
              </label>
              <select
                value={startDevice}
                onChange={(e) => setStartDevice(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#111115] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="phone-alice">phone-alice (Offline Sender)</option>
                <option value="phone-stranger1">phone-stranger1 (Offline Hop 1)</option>
                <option value="phone-stranger2">phone-stranger2 (Offline Hop 2)</option>
                <option value="phone-stranger3">phone-stranger3 (Offline Hop 3)</option>
                <option value="phone-bridge">phone-bridge (Online Gateway)</option>
              </select>
              <span className="text-[10px] text-gray-500 mt-1 block">
                The gossip simulator will place the encrypted packet payload in this virtual node.
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Cryptographic signing in progress...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {isOfflineMode ? 'Sign & Broadcast Offline' : 'Send Direct Money'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SendMoney;
