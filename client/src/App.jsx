import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import SendMoney from './pages/SendMoney';
import ReceiveMoney from './pages/ReceiveMoney';
import TransactionHistory from './pages/TransactionHistory';
import OfflineQueue from './pages/OfflineQueue';
import NearbyDevices from './pages/NearbyDevices';
import DeviceStatus from './pages/DeviceStatus';
import UserProfile from './pages/UserProfile';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090c] text-white flex items-center justify-center font-semibold">
        Verifying cryptographic session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Wrapper
const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090c] text-white flex items-center justify-center font-semibold">
        Verifying cryptographic session...
      </div>
    );
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Gates */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Secure In-App Portals */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/send"
            element={
              <ProtectedRoute>
                <SendMoney />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receive"
            element={
              <ProtectedRoute>
                <ReceiveMoney />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offline-queue"
            element={
              <ProtectedRoute>
                <OfflineQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <ProtectedRoute>
                <NearbyDevices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/device-status"
            element={
              <ProtectedRoute>
                <DeviceStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
