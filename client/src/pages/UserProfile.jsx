import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Mail, Calendar, Key } from 'lucide-react';

export const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 glass rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/10 to-transparent">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-400" /> User Profile
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Review your credentials, VPA configurations, and security credentials.
        </p>
      </div>

      {/* Profile Details */}
      <div className="glass p-8 rounded-2xl border border-white/5 space-y-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-6 border-b border-white/5 pb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-indigo-500/20">
            {user?.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold text-white">{user?.username}</h3>
            <p className="text-sm text-indigo-400 font-mono">{user?.vpa}</p>
          </div>
        </div>

        {/* Informational list */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 gap-2 text-sm">
            <span className="text-gray-400 flex items-center gap-2 justify-center md:justify-start">
              <Mail className="w-4.5 h-4.5 text-gray-400" /> Virtual Payment Address (VPA)
            </span>
            <span className="text-white font-bold font-mono">{user?.vpa}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 gap-2 text-sm">
            <span className="text-gray-400 flex items-center gap-2 justify-center md:justify-start">
              <Key className="w-4.5 h-4.5 text-gray-400" /> Cryptographic Fingerprint
            </span>
            <span className="text-gray-400 font-mono text-[10px] truncate max-w-xs" title={user?.id}>
              {user?.id}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 gap-2 text-sm">
            <span className="text-gray-400 flex items-center gap-2 justify-center md:justify-start">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" /> Account Trust Status
            </span>
            <span className="text-emerald-400 font-bold">Secure Verification Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
