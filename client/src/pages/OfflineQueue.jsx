import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Trash2, CheckCircle, Signal } from 'lucide-react';

export const OfflineQueue = () => {
  const { api } = useAuth();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const savedQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    setQueue(savedQueue);
  }, []);

  const handleClear = () => {
    localStorage.removeItem('offline_queue');
    setQueue([]);
  };

  const handleDelete = (id) => {
    const updated = queue.filter((item) => item.id !== id);
    localStorage.setItem('offline_queue', JSON.stringify(updated));
    setQueue(updated);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-400" /> Offline Packet Queue
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Locally stored hybrid encrypted ciphertexts waiting to hop onto a bridge.
          </p>
        </div>
        {queue.length > 0 && (
          <button
            onClick={handleClear}
            className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/10 text-xs font-bold flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {/* Queue list */}
      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="glass p-8 rounded-2xl border border-white/5 text-center text-gray-500 italic">
            Your offline transaction buffer is empty.
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="glass p-5 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-400 font-mono font-bold">
                      To: {item.receiverVpa}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white">
                    ₹{item.amount.toFixed(2)}
                  </h3>
                  <span className="text-[10px] text-gray-500 block">
                    Signed at: {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/10"
                  title="Delete Packet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Encrypted Raw Base64 string block */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 relative">
                <span className="text-[8px] font-bold text-gray-500 block uppercase tracking-wider mb-1">
                  Enveloped base64 payload:
                </span>
                <p className="text-[9px] font-mono text-gray-400 break-all select-all leading-tight pr-8">
                  {item.packet.ciphertext}
                </p>
                <div className="absolute right-2 bottom-2">
                  <Signal className="w-3.5 h-3.5 text-indigo-500/40" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OfflineQueue;
