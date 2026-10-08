import React, { useState } from 'react';
import { Store, Lock, User, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { User as UserType, SHOP_NAME } from '../../types';
import { storage } from '../../services/storage';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = storage.login(username.trim(), password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.message || 'Invalid username or password.');
      }
    }, 200);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div
          className="rounded-3xl shadow-xl border overflow-hidden p-8 sm:p-10"
          style={{
            backgroundColor: '#FFFDF8',
            borderColor: '#E6DCCB',
          }}
        >
          {/* Shop Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                backgroundColor: '#6B1E2B',
                boxShadow: '0 10px 25px -5px rgba(107, 30, 43, 0.3)',
              }}
            >
              <Store className="w-9 h-9" />
            </div>

            <h1
              className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ color: '#6B1E2B' }}
            >
              {SHOP_NAME}
            </h1>
            <p
              className="text-xs sm:text-sm font-medium mt-1.5"
              style={{ color: '#6E6460' }}
            >
              Point of Sale &amp; Inventory Management
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border animate-in fade-in duration-150"
              style={{
                backgroundColor: '#FDF2F3',
                borderColor: '#F5C6CB',
                color: '#6B1E2B',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#2B2523' }}
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#6E6460' }}
                />
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#2B2523' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#6E6460' }}
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
                style={{
                  backgroundColor: '#6B1E2B',
                  boxShadow: '0 8px 20px -4px rgba(107, 30, 43, 0.35)',
                }}
              >
                <span>{isLoading ? 'Verifying...' : 'LOGIN'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Access Helpers */}
          <div
            className="mt-8 pt-5 border-t text-xs"
            style={{ borderColor: '#E6DCCB' }}
          >
            <div
              className="text-center font-semibold mb-2.5"
              style={{ color: '#6E6460' }}
            >
              Quick Login Roles:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="py-2 px-3 rounded-xl border text-left transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              >
                <div className="font-bold flex items-center space-x-1" style={{ color: '#6B1E2B' }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('cashier', 'cashier123')}
                className="py-2 px-3 rounded-xl border text-left transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              >
                <div className="font-bold flex items-center space-x-1" style={{ color: '#6B1E2B' }}>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cashier</span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">cashier / cashier123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs mt-6" style={{ color: '#6E6460' }}>
          Blessing Shop Point of Sale • Secure Store Access
        </div>
      </div>
    </div>
  );
};
