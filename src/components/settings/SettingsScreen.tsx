import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Coins,
  Shield,
  Check,
  Lock,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings, User, SHOP_NAME } from '../../types';
import { storage } from '../../services/storage';

interface SettingsScreenProps {
  settings: AppSettings;
  currentUser: User;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onLogout: () => void;
  onRefreshAll?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onLogout,
  onRefreshAll,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    shopName: SHOP_NAME,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const executeResetEverything = () => {
    try {
      storage.removeAllData();
      const freshSettings = storage.getSettings();
      setFormData({ ...freshSettings, shopName: SHOP_NAME });
      onUpdateSettings(freshSettings);
      onRefreshAll?.();
      setIsResetModalOpen(false);
      setResetFeedback({
        type: 'success',
        message: 'All data has been permanently removed! Products, sales, and records are completely cleared.',
      });
      setTimeout(() => setResetFeedback(null), 5000);
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err?.message || 'Failed to remove data.',
      });
    }
  };

  const handleRestoreSampleProducts = () => {
    try {
      storage.restoreSampleProducts();
      const freshSettings = storage.getSettings();
      setFormData({ ...freshSettings, shopName: SHOP_NAME });
      onUpdateSettings(freshSettings);
      onRefreshAll?.();
      setResetFeedback({
        type: 'success',
        message: 'Sample demo products and categories have been restored successfully.',
      });
      setTimeout(() => setResetFeedback(null), 5000);
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err?.message || 'Failed to load sample products.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      return;
    }
    // Always keep shopName fixed to Blessing Shop
    const updated = storage.updateSettings(
      {
        ...formData,
        shopName: SHOP_NAME,
      },
      currentUser.role
    );
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!isAdmin) {
    return (
      <div
        className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-4"
        style={{ color: '#2B2523' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border"
          style={{
            backgroundColor: '#FDF2F3',
            borderColor: '#F5C6CB',
            color: '#6B1E2B',
          }}
        >
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: '#6B1E2B' }}>
          Administrator Access Required
        </h2>
        <p className="text-sm" style={{ color: '#6E6460' }}>
          Settings are restricted to store administrators. Please contact your manager or switch to an administrator profile.
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: '#6B1E2B' }}
        >
          Store Settings
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6E6460' }}>
          Configure address, phone, currency (ETB), and stock thresholds.
        </p>
      </div>

      {resetFeedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border animate-in fade-in duration-150 ${
            resetFeedback.type === 'success'
              ? 'bg-[#F7EBED] text-[#6B1E2B] border-[#E6DCCB]'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {resetFeedback.type === 'success' ? (
            <Check className="w-5 h-5 text-[#6B1E2B] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
          )}
          <span>{resetFeedback.message}</span>
        </div>
      )}

      {savedSuccess && (
        <div
          className="p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border animate-in fade-in duration-150"
          style={{
            backgroundColor: '#F7EBED',
            borderColor: '#E6DCCB',
            color: '#6B1E2B',
          }}
        >
          <Check className="w-5 h-5 text-[#6B1E2B]" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Fixed Store Identity Card */}
      <div
        className="rounded-2xl p-5 border shadow-sm flex items-center justify-between"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold"
            style={{ backgroundColor: '#6B1E2B' }}
          >
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-lg" style={{ color: '#2B2523' }}>
                {SHOP_NAME}
              </h3>
              <span
                className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#6B1E2B',
                }}
              >
                Fixed Shop Name
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#6E6460' }}>
              Shop name is permanent and displays across all screens and transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Shop Address */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1.5"
              style={{ color: '#2B2523' }}
            >
              <MapPin className="w-4 h-4" style={{ color: '#6B1E2B' }} />
              <span>Shop Address</span>
            </label>
            <input
              type="text"
              value={formData.shopAddress}
              onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
              placeholder="e.g. Bole Road, Addis Ababa"
              className="w-full px-4 py-2.5 border rounded-xl font-medium outline-none text-sm"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1.5"
              style={{ color: '#2B2523' }}
            >
              <Phone className="w-4 h-4" style={{ color: '#6B1E2B' }} />
              <span>Phone Number</span>
            </label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="e.g. +251 911 234 567"
              className="w-full px-4 py-2.5 border rounded-xl font-medium outline-none text-sm"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            />
          </div>

          {/* Currency */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1.5"
              style={{ color: '#2B2523' }}
            >
              <Coins className="w-4 h-4" style={{ color: '#6B1E2B' }} />
              <span>Currency Code</span>
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
              placeholder="ETB"
              className="w-full px-4 py-2.5 border rounded-xl font-bold font-mono outline-none text-sm"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            />
            <p className="text-[11px] mt-1" style={{ color: '#6E6460' }}>Default: ETB (Ethiopian Birr)</p>
          </div>

          {/* Default Minimum Stock Threshold */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1.5"
              style={{ color: '#2B2523' }}
            >
              <Shield className="w-4 h-4" style={{ color: '#6B1E2B' }} />
              <span>Default Low Stock Threshold</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.defaultMinStockThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultMinStockThreshold: parseInt(e.target.value, 10) || 5,
                })
              }
              className="w-full px-4 py-2.5 border rounded-xl font-mono outline-none text-sm"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            />
            <p className="text-[11px] mt-1" style={{ color: '#6E6460' }}>
              Products at or below this value show a LOW STOCK alert.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end" style={{ borderColor: '#E6DCCB' }}>
          <button
            type="submit"
            className="px-6 py-3 text-white font-bold rounded-xl text-sm shadow active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            style={{
              backgroundColor: '#6B1E2B',
              boxShadow: '0 4px 12px rgba(107, 30, 43, 0.25)',
            }}
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset Everything */}
      <div
        className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-4"
        style={{
          backgroundColor: '#FDF2F3',
          borderColor: '#F5C6CB',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: '#6B1E2B' }}
              >
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#6B1E2B' }}>
                Danger Zone: Reset All Data (Remove Everything)
              </h3>
            </div>
            <p className="text-xs sm:text-sm mt-1" style={{ color: '#6E6460' }}>
              Permanently wipe and remove all products, sales transactions, stock movements, and categories. Leaves the store completely empty and fresh.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreSampleProducts}
              className="px-3.5 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center space-x-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>Load Sample Demo Products</span>
            </button>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center space-x-2 shadow-sm"
              style={{
                backgroundColor: '#6B1E2B',
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset &amp; Remove Everything</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FDF2F3', color: '#6B1E2B' }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base" style={{ color: '#6B1E2B' }}>
                  Reset &amp; Remove Everything?
                </h3>
                <p className="text-xs" style={{ color: '#6E6460' }}>
                  Wipe all store data and start completely fresh
                </p>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border text-xs leading-relaxed space-y-2"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            >
              <p className="font-bold text-rose-800">
                Are you sure you want to remove everything?
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-neutral-700 text-xs">
                <li><strong className="text-rose-900">All products</strong> will be permanently deleted (0 products remaining)</li>
                <li><strong className="text-rose-900">All sales records</strong> will be permanently wiped (0 sales history)</li>
                <li><strong className="text-rose-900">All stock movements</strong> and restock logs will be cleared</li>
                <li><strong className="text-rose-900">All categories</strong> will be removed</li>
              </ul>
              <p className="text-neutral-500 italic text-[11px] pt-1">
                You can download an Excel backup or JSON backup from the Excel Import/Export tab before resetting if needed.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeResetEverything}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow active:scale-95 flex items-center space-x-1.5"
                style={{
                  backgroundColor: '#6B1E2B',
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Remove Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
