import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, Cpu, Bluetooth, RefreshCw } from 'lucide-react';

export const NearbyDevices = () => {
  const { api } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const scanDevices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/mesh/state');
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanDevices();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-400 animate-pulse" /> BLE Nearby Discovery
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Scan and detect local peripheral devices active inside the mesh network.
          </p>
        </div>
        <button
          onClick={scanDevices}
          disabled={loading}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* BLE Scanning Radar and Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Radar Map Graphic */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>

          <div className="w-32 h-32 rounded-full border border-indigo-500/20 flex items-center justify-center relative animate-pulse-slow">
            <div className="w-24 h-24 rounded-full border border-indigo-500/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-indigo-500/40 flex items-center justify-center">
                <Bluetooth className="w-8 h-8 text-indigo-400 animate-bounce" />
              </div>
            </div>
            {/* Swivel Scanner line */}
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400/40 animate-spin-slow"></div>
          </div>

          <span className="text-xs text-gray-400 font-semibold tracking-widest uppercase mt-6">
            {loading ? 'Scanning Bluetooth channels...' : 'Discoverable channel active'}
          </span>
        </div>

        {/* Scan Results */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">
            Detected Peripherals ({devices.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devices.map((dev) => (
              <div
                key={dev.deviceId}
                className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-40 group relative overflow-hidden hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
                      Peripheral Node
                    </span>
                    <h4 className="font-bold text-base text-white">
                      {dev.deviceId.replace('phone-', '').toUpperCase()}
                    </h4>
                  </div>
                  <Cpu className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                </div>

                <div className="space-y-2 border-t border-white/5 pt-3 mt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mesh Signal strength:</span>
                    <span className="text-emerald-400 font-bold">-62 dBm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connection state:</span>
                    <span className={dev.hasInternet ? 'text-emerald-400 font-semibold' : 'text-indigo-400'}>
                      {dev.hasInternet ? 'Internet Bridge' : 'Offline Hop'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyDevices;
