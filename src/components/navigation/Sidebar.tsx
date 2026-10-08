import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  History,
  TrendingUp,
  Tag,
  FileSpreadsheet,
  Settings,
  X,
  User,
  LogOut,
  Store,
  Shield,
  UserCheck,
} from 'lucide-react';
import { AppSettings, User as UserType, SHOP_NAME } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  settings: AppSettings;
  currentUser: UserType;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  currentUser,
  isOpenMobile,
  onCloseMobile,
  onLogout,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Navigation items filtered by role
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'pos', label: 'POS / New Sale', icon: ShoppingCart, highlight: true, adminOnly: false },
    { id: 'products', label: 'Products Catalog', icon: Package, adminOnly: false },
    { id: 'sales', label: 'Sales History', icon: History, adminOnly: false },
    { id: 'inventory', label: 'Inventory & Restock', icon: Layers, adminOnly: true },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp, adminOnly: true },
    { id: 'categories', label: 'Categories', icon: Tag, adminOnly: true },
    { id: 'import-export', label: 'Excel Import / Backup', icon: FileSpreadsheet, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  const visibleNavItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSelect = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 flex flex-col border-r transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        {/* Brand / Logo */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shadow-md shrink-0"
              style={{ backgroundColor: '#6B1E2B' }}
            >
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div
                className="font-black text-lg tracking-tight leading-tight"
                style={{ color: '#6B1E2B' }}
              >
                {SHOP_NAME}
              </div>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: '#6E6460' }}
              >
                POS &amp; Inventory
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg hover:bg-neutral-200 transition-colors lg:hidden"
            style={{ color: '#2B2523' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{
                  backgroundColor: isActive
                    ? '#6B1E2B'
                    : item.highlight
                    ? '#F7EBED'
                    : 'transparent',
                  color: isActive
                    ? '#FFFFFF'
                    : item.highlight
                    ? '#6B1E2B'
                    : '#2B2523',
                  boxShadow: isActive ? '0 4px 12px rgba(107, 30, 43, 0.25)' : 'none',
                }}
              >
                <Icon
                  className="w-5 h-5 shrink-0"
                  style={{
                    color: isActive ? '#FFFFFF' : item.highlight ? '#6B1E2B' : '#6E6460',
                  }}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'pos' && !isActive && (
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#E6DCCB', color: '#6B1E2B' }}
                  >
                    Sale
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Session & Logout Card */}
        <div
          className="p-3 border-t"
          style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
        >
          <div
            className="p-3 rounded-xl border flex items-center justify-between"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
            }}
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 text-white"
                style={{ backgroundColor: isAdmin ? '#6B1E2B' : '#2B2523' }}
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <div
                  className="text-xs font-bold leading-tight truncate"
                  style={{ color: '#2B2523' }}
                >
                  {currentUser.name}
                </div>
                <div
                  className="text-[10px] font-extrabold uppercase mt-0.5"
                  style={{ color: '#6B1E2B' }}
                >
                  {currentUser.role}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-red-800 transition-colors cursor-pointer"
              title="Logout"
              style={{ color: '#6B1E2B' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
