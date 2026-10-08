import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  AlertTriangle,
  Plus,
  ShoppingCart,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { Product, Sale, AppSettings, User, SHOP_NAME } from '../../types';

interface DashboardScreenProps {
  products: Product[];
  sales: Sale[];
  settings: AppSettings;
  currentUser: User;
  onNavigate: (tab: string) => void;
  onQuickRestock: (product: Product) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  products,
  sales,
  settings,
  currentUser,
  onNavigate,
  onQuickRestock,
}) => {
  // Compute metrics for "Today"
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.createdAt.startsWith(todayPrefix));

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
  const todayTransactionsCount = todaySales.length;

  let todayProfit = 0;
  let hasCostData = false;

  todaySales.forEach((s) => {
    let saleItemProfit = 0;
    s.items.forEach((item) => {
      if (item.costPrice > 0) {
        hasCostData = true;
        saleItemProfit += (item.unitPrice - item.costPrice) * item.quantity;
      }
    });
    todayProfit += Math.max(0, saleItemProfit - (s.discount || 0));
  });

  const totalProducts = products.length;
  const totalItemsInStock = products.reduce((acc, p) => acc + p.stockQuantity, 0);

  const lowStockProducts = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockThreshold
  );

  const outOfStockProducts = products.filter((p) => p.stockQuantity === 0);

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* Top Banner / Welcome in Deep Maroon */}
      <div
        className="rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white"
        style={{
          backgroundColor: '#6B1E2B',
          boxShadow: '0 8px 25px rgba(107, 30, 43, 0.25)',
        }}
      >
        <div>
          <div
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-2"
            style={{ backgroundColor: 'rgba(255, 248, 231, 0.2)', color: '#FFF8E7' }}
          >
            <span>● Store Active</span>
            <span>•</span>
            <span>{settings.currency} Currency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {SHOP_NAME}
          </h1>
          <p className="text-xs sm:text-sm mt-1 max-w-xl opacity-90 text-[#FFF8E7]">
            Point of Sale &amp; Inventory Management. Type product code to complete sales in seconds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center space-x-2 px-5 py-3 font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
            style={{
              backgroundColor: '#FFF8E7',
              color: '#6B1E2B',
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS / New Sale</span>
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('import-export')}
              className="flex items-center space-x-2 px-4 py-3 border font-medium text-sm rounded-xl transition-all cursor-pointer"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 248, 231, 0.3)',
                color: '#FFF8E7',
              }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6E6460' }}
            >
              Today's Sales
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#F7EBED', color: '#6B1E2B' }}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className="text-2xl sm:text-3xl font-black font-mono"
              style={{ color: '#6B1E2B' }}
            >
              {settings.currency} {todayRevenue.toFixed(2)}
            </div>
            <div className="text-xs mt-1" style={{ color: '#6E6460' }}>
              {todayTransactionsCount} transaction{todayTransactionsCount === 1 ? '' : 's'} recorded today
            </div>
          </div>
        </div>

        {/* Today's Profit */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6E6460' }}
            >
              Today's Profit
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#F7EBED', color: '#6B1E2B' }}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            {hasCostData || todayRevenue > 0 ? (
              <div
                className="text-2xl sm:text-3xl font-black font-mono"
                style={{ color: '#2B2523' }}
              >
                {settings.currency} {todayProfit.toFixed(2)}
              </div>
            ) : (
              <div className="text-sm font-semibold text-neutral-400">
                Awaiting sales with cost prices
              </div>
            )}
            <div className="text-xs mt-1" style={{ color: '#6E6460' }}>
              (Selling Price − Cost Price) × Sold
            </div>
          </div>
        </div>

        {/* Total Products & Inventory */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6E6460' }}
            >
              Catalog &amp; Stock
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#FFF8E7', color: '#2B2523' }}
            >
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className="text-2xl sm:text-3xl font-black font-mono"
              style={{ color: '#2B2523' }}
            >
              {totalProducts}{' '}
              <span className="text-sm font-semibold font-sans" style={{ color: '#6E6460' }}>
                Products
              </span>
            </div>
            <div className="text-xs mt-1 flex items-center space-x-1" style={{ color: '#6E6460' }}>
              <Layers className="w-3.5 h-3.5" />
              <span>{totalItemsInStock} total units on hand</span>
            </div>
          </div>
        </div>

        {/* Stock Alerts (Low & Out) */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6E6460' }}
            >
              Stock Alerts
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-3">
              <div
                className="text-xl sm:text-2xl font-black font-mono"
                style={{ color: '#6B1E2B' }}
              >
                {outOfStockProducts.length}{' '}
                <span className="text-xs font-bold uppercase font-sans">Out</span>
              </div>
              <span style={{ color: '#E6DCCB' }}>|</span>
              <div
                className="text-xl sm:text-2xl font-black font-mono"
                style={{ color: '#B45309' }}
              >
                {lowStockProducts.length}{' '}
                <span className="text-xs font-bold uppercase font-sans">Low</span>
              </div>
            </div>
            <div className="text-xs mt-1" style={{ color: '#6E6460' }}>
              Items requiring attention or restock
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Columns: Stock Attention & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Out of Stock & Low Stock Items */}
        <div
          className="rounded-2xl border shadow-sm overflow-hidden flex flex-col"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" style={{ color: '#6B1E2B' }} />
              <h2 className="font-bold text-sm sm:text-base" style={{ color: '#2B2523' }}>
                Stock Attention List
              </h2>
            </div>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-bold flex items-center space-x-1 cursor-pointer"
                style={{ color: '#6B1E2B' }}
              >
                <span>Manage Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y flex-1 overflow-y-auto max-h-[380px]" style={{ borderColor: '#E6DCCB' }}>
            {outOfStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FFF8E7] transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-mono text-xs font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: '#FDF2F3',
                        color: '#6B1E2B',
                        borderColor: '#E6DCCB',
                      }}
                    >
                      {p.productCode}
                    </span>
                    <span className="font-bold text-sm" style={{ color: '#2B2523' }}>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#6E6460' }}>
                    Category: {p.category} • Price: {settings.currency} {p.sellingPrice.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: '#FDF2F3',
                      color: '#6B1E2B',
                      borderColor: '#F5C6CB',
                    }}
                  >
                    OUT OF STOCK
                  </span>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => onQuickRestock(p)}
                      className="p-1.5 rounded-lg border transition-colors cursor-pointer"
                      style={{
                        backgroundColor: '#FFF8E7',
                        borderColor: '#E6DCCB',
                        color: '#6B1E2B',
                      }}
                      title="Quick Restock"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FFF8E7] transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-mono text-xs font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: '#FFF8E7',
                        color: '#2B2523',
                        borderColor: '#E6DCCB',
                      }}
                    >
                      {p.productCode}
                    </span>
                    <span className="font-bold text-sm" style={{ color: '#2B2523' }}>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#6E6460' }}>
                    Current: <strong>{p.stockQuantity}</strong> (Min: {p.minStockThreshold})
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      borderColor: '#FCD34D',
                    }}
                  >
                    LOW STOCK
                  </span>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => onQuickRestock(p)}
                      className="p-1.5 rounded-lg border transition-colors cursor-pointer"
                      style={{
                        backgroundColor: '#FFF8E7',
                        borderColor: '#E6DCCB',
                        color: '#6B1E2B',
                      }}
                      title="Quick Restock"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
              <div className="p-8 text-center" style={{ color: '#6E6460' }}>
                <Package className="w-10 h-10 mx-auto mb-2 opacity-60" style={{ color: '#6B1E2B' }} />
                <p className="text-sm font-bold" style={{ color: '#2B2523' }}>
                  All products in healthy stock!
                </p>
                <p className="text-xs mt-0.5">No low stock or out-of-stock items detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Activity */}
        <div
          className="rounded-2xl border shadow-sm overflow-hidden flex flex-col"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" style={{ color: '#6B1E2B' }} />
              <h2 className="font-bold text-sm sm:text-base" style={{ color: '#2B2523' }}>
                Recent Completed Sales
              </h2>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold flex items-center space-x-1 cursor-pointer"
              style={{ color: '#6B1E2B' }}
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y flex-1 overflow-y-auto max-h-[380px]" style={{ borderColor: '#E6DCCB' }}>
            {sales.slice(0, 8).map((sale) => (
              <div
                key={sale.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FFF8E7] transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: '#2B2523' }}
                    >
                      {sale.receiptNumber}
                    </span>
                    <span className="text-xs" style={{ color: '#6E6460' }}>
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#6E6460' }}>
                    {sale.items.length} item{sale.items.length === 1 ? '' : 's'} • Cashier: {sale.cashierName}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div
                      className="font-black font-mono text-sm"
                      style={{ color: '#6B1E2B' }}
                    >
                      {settings.currency} {sale.grandTotal.toFixed(2)}
                    </div>
                    <div
                      className="text-[10px] uppercase font-bold"
                      style={{ color: '#6E6460' }}
                    >
                      {sale.paymentMethod}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {sales.length === 0 && (
              <div className="p-8 text-center" style={{ color: '#6E6460' }}>
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                <p className="text-sm font-bold" style={{ color: '#2B2523' }}>
                  No sales completed yet
                </p>
                <p className="text-xs mt-0.5">Go to POS to start selling items.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div
        className="p-5 rounded-2xl border shadow-sm"
        style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: '#6E6460' }}
        >
          Quick Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('pos')}
            className="p-3.5 rounded-xl border text-left transition-all cursor-pointer group"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
            }}
          >
            <div
              className="font-bold text-sm flex items-center justify-between"
              style={{ color: '#6B1E2B' }}
            >
              <span>New Sale</span>
              <ShoppingCart className="w-4 h-4" />
            </div>
            <p className="text-xs mt-1" style={{ color: '#6E6460' }}>
              Speed-type product codes
            </p>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('inventory')}
              className="p-3.5 rounded-xl border text-left transition-all cursor-pointer group"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
              }}
            >
              <div
                className="font-bold text-sm flex items-center justify-between"
                style={{ color: '#6B1E2B' }}
              >
                <span>Restock Items</span>
                <RefreshCw className="w-4 h-4" />
              </div>
              <p className="text-xs mt-1" style={{ color: '#6E6460' }}>
                Add inventory quantities
              </p>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('products')}
              className="p-3.5 rounded-xl border text-left transition-all cursor-pointer group"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
              }}
            >
              <div
                className="font-bold text-sm flex items-center justify-between"
                style={{ color: '#6B1E2B' }}
              >
                <span>Add Product</span>
                <Plus className="w-4 h-4" />
              </div>
              <p className="text-xs mt-1" style={{ color: '#6E6460' }}>
                New code &amp; pricing
              </p>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('reports')}
              className="p-3.5 rounded-xl border text-left transition-all cursor-pointer group"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
              }}
            >
              <div
                className="font-bold text-sm flex items-center justify-between"
                style={{ color: '#6B1E2B' }}
              >
                <span>Reports</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-xs mt-1" style={{ color: '#6E6460' }}>
                Revenue &amp; inventory valuation
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
