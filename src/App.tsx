/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { storage } from './services/storage';
import { Product, Sale, Category, AppSettings, User } from './types';
import { Sidebar } from './components/navigation/Sidebar';
import { Navbar } from './components/navigation/Navbar';
import { POSScreen } from './components/pos/POSScreen';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ProductsScreen } from './components/products/ProductsScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { SalesHistoryScreen } from './components/sales/SalesHistoryScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { CategoriesScreen } from './components/categories/CategoriesScreen';
import { ImportExportScreen } from './components/import-export/ImportExportScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { LoginScreen } from './components/auth/LoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getActiveSession());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);

  // Synchronize state from storage
  const refreshData = useCallback(() => {
    setProducts(storage.getProducts());
    setSales(storage.getSales());
    setCategories(storage.getCategories());
    setSettings(storage.getSettings());
    const session = storage.getActiveSession();
    setCurrentUser(session);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Global hotkeys (e.g. F2 to jump to POS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (user: User) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
    setCurrentTab('dashboard'); // Redirect to Dashboard on login
    refreshData();
  };

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
    setCurrentTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  // If unauthenticated, display the Login page before accessing any protected page
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'admin';
  const cashierAllowedTabs = ['dashboard', 'pos', 'products', 'sales'];

  const handleSelectTab = (tab: string) => {
    if (!isAdmin && !cashierAllowedTabs.includes(tab)) {
      return; // Cashiers strictly blocked from unauthorized tabs
    }
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Enforce access control on active tab
  const activeTab = (!isAdmin && !cashierAllowedTabs.includes(currentTab)) ? 'dashboard' : currentTab;

  const handleQuickRestockFromDashboard = (product: Product) => {
    if (!isAdmin) return;
    setQuickRestockProduct(product);
    setCurrentTab('inventory');
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden font-sans antialiased selection:bg-[#6B1E2B] selection:text-white"
      style={{ backgroundColor: '#FFF8E7', color: '#2B2523' }}
    >
      {/* Sidebar (Desktop permanent, Mobile off-canvas) */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={handleSelectTab}
        settings={settings}
        currentUser={currentUser}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Navbar
          currentTab={activeTab}
          onNavigate={handleSelectTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          settings={settings}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#FFF8E7' }}>
          {activeTab === 'dashboard' && (
            <DashboardScreen
              products={products}
              sales={sales}
              settings={settings}
              currentUser={currentUser}
              onNavigate={handleSelectTab}
              onQuickRestock={handleQuickRestockFromDashboard}
            />
          )}

          {activeTab === 'pos' && (
            <POSScreen
              settings={settings}
              currentUser={currentUser}
              onRefreshData={refreshData}
            />
          )}

          {activeTab === 'products' && (
            <ProductsScreen
              products={products}
              settings={settings}
              currentUser={currentUser}
              onRefresh={refreshData}
              onOpenImport={() => {
                if (isAdmin) handleSelectTab('import-export');
              }}
            />
          )}

          {activeTab === 'inventory' && isAdmin && (
            <InventoryScreen
              products={products}
              settings={settings}
              currentUser={currentUser}
              onRefresh={refreshData}
              quickRestockProduct={quickRestockProduct}
              onClearQuickRestock={() => setQuickRestockProduct(null)}
            />
          )}

          {activeTab === 'sales' && (
            <SalesHistoryScreen
              sales={sales}
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'reports' && isAdmin && (
            <ReportsScreen
              products={products}
              sales={sales}
              settings={settings}
            />
          )}

          {activeTab === 'categories' && isAdmin && (
            <CategoriesScreen
              categories={categories}
              products={products}
              currentUser={currentUser}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'import-export' && isAdmin && (
            <ImportExportScreen
              products={products}
              sales={sales}
              settings={settings}
              currentUser={currentUser}
              onRefreshAll={refreshData}
            />
          )}

          {activeTab === 'settings' && isAdmin && (
            <SettingsScreen
              settings={settings}
              currentUser={currentUser}
              onUpdateSettings={(newSettings) => setSettings(newSettings)}
              onLogout={handleLogout}
              onRefreshAll={refreshData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
