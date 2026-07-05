import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Send,
  Download,
  History,
  Clock,
  Radio,
  Activity,
  User,
  Settings,
  LogOut,
  Signal,
  Menu,
  X,
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Send Money', path: '/send', icon: Send },
    { name: 'Receive Money', path: '/receive', icon: Download },
    { name: 'Transaction History', path: '/transactions', icon: History },
    { name: 'Offline Queue', path: '/offline-queue', icon: Clock },
    { name: 'Nearby Devices', path: '/devices', icon: Radio },
    { name: 'Device Status', path: '/device-status', icon: Activity },
    { name: 'User Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-[#09090c] text-[#f0f0f5] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/10 p-5 shrink-0 z-20">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Signal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              UPI OFFLINE
            </h1>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">
              Mesh Network
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600/80 text-white font-medium shadow-md shadow-indigo-600/10 border border-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        {user && (
          <div className="mt-auto border-t border-white/5 pt-4">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-xs text-gray-400 truncate">{user.vpa}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors border border-transparent"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Header - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 glass z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
              <Signal className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              UPI OFFLINE
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[65px] bg-[#09090c]/95 z-50 p-6 flex flex-col space-y-4">
            <nav className="space-y-1 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            {user && (
              <div className="border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>

          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
