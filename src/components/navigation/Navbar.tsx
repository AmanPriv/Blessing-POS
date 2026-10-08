import React, { useState, useEffect } from 'react';
import { Menu, ShoppingCart, LogOut, Shield, UserCheck, Calendar } from 'lucide-react';
import { AppSettings, User as UserType, SHOP_NAME } from '../../types';
import { formatEthiopianDate } from '../../utils/ethiopianCalendar';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenMobileMenu: () => void;
  settings: AppSettings;
  currentUser: UserType;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenMobileMenu,
  settings,
  currentUser,
  onLogout,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Store Dashboard';
      case 'pos':
        return 'POS / New Sale';
      case 'products':
        return 'Products Catalog';
      case 'inventory':
        return 'Inventory & Restock';
      case 'sales':
        return 'Sales History';
      case 'reports':
        return 'Analytics & Reports';
      case 'categories':
        return 'Product Categories';
      case 'import-export':
        return 'Excel Import & Backup';
      case 'settings':
        return 'Store Settings';
      default:
        return SHOP_NAME;
    }
  };

  return (
    <header
      className="h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 border-b"
      style={{
        backgroundColor: '#FFFDF8',
        borderColor: '#E6DCCB',
      }}
    >
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-xl lg:hidden cursor-pointer transition-colors"
          style={{ color: '#2B2523' }}
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2
            className="font-black text-lg sm:text-xl leading-tight tracking-tight"
            style={{ color: '#6B1E2B' }}
          >
            {getTitle()}
          </h2>
          <span
            className="text-[11px] font-semibold hidden sm:inline"
            style={{ color: '#6E6460' }}
          >
            {SHOP_NAME} • Currency: {settings.currency}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Ethiopian Calendar Badge */}
        <div
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs"
          style={{
            backgroundColor: '#FFF8E7',
            borderColor: '#E6DCCB',
            color: '#6B1E2B',
          }}
          title="Current Ethiopian Calendar Date (ዓ.ም)"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-700" />
          <span>{formatEthiopianDate(new Date())}</span>
        </div>

        {/* Clock & Currency */}
        <div
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border"
          style={{
            backgroundColor: '#FFF8E7',
            borderColor: '#E6DCCB',
            color: '#2B2523',
          }}
        >
          <span>{timeStr}</span>
          <span style={{ color: '#E6DCCB' }}>|</span>
          <span className="font-mono font-bold" style={{ color: '#6B1E2B' }}>
            {settings.currency}
          </span>
        </div>

        {/* Quick POS shortcut if not on POS */}
        {currentTab !== 'pos' && (
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all cursor-pointer active:scale-95"
            style={{
              backgroundColor: '#6B1E2B',
              boxShadow: '0 4px 10px rgba(107, 30, 43, 0.25)',
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        )}

        {/* User Pill */}
        <div
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold"
          style={{
            backgroundColor: '#FFF8E7',
            borderColor: '#E6DCCB',
            color: '#2B2523',
          }}
        >
          <div
            className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: '#6B1E2B' }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <span className="hidden md:inline">{currentUser.name}</span>
          <span
            className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: '#F7EBED',
              color: '#6B1E2B',
            }}
          >
            {currentUser.role}
          </span>
        </div>

        {/* Explicit Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-1 p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: '#FFF8E7',
            borderColor: '#E6DCCB',
            color: '#6B1E2B',
          }}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
