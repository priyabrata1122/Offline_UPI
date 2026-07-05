import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, QrCode, Copy, Check } from 'lucide-react';

export const ReceiveMoney = () => {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const upiString = `upi://pay?pa=${user?.vpa}&pn=${user?.username}&cu=INR`;

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.vpa || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-indigo-400" /> Receive Money
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Provide your unique Virtual Payment Address (VPA) or display your scannable UPI deep-link QR.
        </p>
      </div>

      {/* QR Code and Details Card */}
      <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-6">
        {/* Mock QR Representation */}
        <div className="p-4 bg-white rounded-2xl shadow-xl relative group">
          <div className="w-48 h-48 bg-gray-100 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl relative overflow-hidden">
            <QrCode className="w-16 h-16 text-[#09090c]" />
            <span className="text-[10px] font-bold text-[#09090c] mt-2 font-mono uppercase">
              Scannable Address
            </span>
            <div className="absolute inset-0 bg-[#09090c]/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center">
              <span className="text-white text-xs font-semibold">Deep Link URI:</span>
              <p className="text-indigo-400 text-[10px] break-all font-mono mt-1 pr-1 pl-1">
                {upiString}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Virtual Payment Address (VPA)
          </span>
          <div className="flex items-center gap-2 justify-center">
            <h3 className="text-xl font-extrabold text-white font-mono">{user?.vpa}</h3>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Copy VPA"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Valid in both online networks and simulated offline Bluetooth nodes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiveMoney;
