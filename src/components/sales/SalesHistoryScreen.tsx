import React, { useState } from 'react';
import {
  Search,
  FileSpreadsheet,
  Eye,
  Clock,
  X,
  CreditCard,
  Banknote,
  Building,
} from 'lucide-react';
import { Sale, AppSettings, User } from '../../types';
import { exportSalesToExcel } from '../../services/excelService';
import { formatEthiopianDate, formatEthiopianShort } from '../../utils/ethiopianCalendar';

interface SalesHistoryScreenProps {
  sales: Sale[];
  settings: AppSettings;
  currentUser: User;
}

export const SalesHistoryScreen: React.FC<SalesHistoryScreenProps> = ({
  sales,
  settings,
  currentUser,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<
    'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  >('all');
  const [onlyMySales, setOnlyMySales] = useState(currentUser?.role === 'cashier');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Filter sales based on period, cashier and search query
  const filteredSales = sales.filter((sale) => {
    if (onlyMySales && sale.cashierId !== currentUser?.id && sale.cashierName !== currentUser?.name) {
      return false;
    }

    const saleDate = new Date(sale.createdAt);
    const now = new Date();

    if (filterPeriod === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      if (!sale.createdAt.startsWith(todayStr)) return false;
    } else if (filterPeriod === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      if (!sale.createdAt.startsWith(yStr)) return false;
    } else if (filterPeriod === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (saleDate < oneWeekAgo) return false;
    } else if (filterPeriod === 'month') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      if (saleDate < oneMonthAgo) return false;
    } else if (filterPeriod === 'custom') {
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        if (saleDate > endD) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTxn = sale.receiptNumber.toLowerCase().includes(q);
      const matchesCashier = sale.cashierName.toLowerCase().includes(q);
      const matchesItems = sale.items.some(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.productCode.toLowerCase().includes(q)
      );
      if (!matchesTxn && !matchesCashier && !matchesItems) return false;
    }

    return true;
  });

  const totalPeriodRevenue = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);

  const totalPeriodItems = filteredSales.reduce(
    (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.quantity, 0),
    0
  );

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: '#6B1E2B' }}
          >
            Sales History &amp; Transactions
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6E6460' }}>
            Look up historical transactions, inspect line items, and audit sales.
          </p>
        </div>

        <button
          onClick={() => exportSalesToExcel(filteredSales)}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-4 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all cursor-pointer"
          style={{
            backgroundColor: '#6B1E2B',
            boxShadow: '0 4px 12px rgba(107, 30, 43, 0.25)',
          }}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-200" />
          <span>Export Sales Excel</span>
        </button>
      </div>

      {/* Summary KPI Ribbon for Current Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className="p-4 rounded-xl border shadow-sm flex items-center justify-between"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6E6460' }}
            >
              Filtered Sales
            </span>
            <div
              className="text-xl font-black font-mono mt-0.5"
              style={{ color: '#6B1E2B' }}
            >
              {settings.currency} {totalPeriodRevenue.toFixed(2)}
            </div>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded font-bold border"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            {filteredSales.length} txns
          </span>
        </div>

        <div
          className="p-4 rounded-xl border shadow-sm flex items-center justify-between"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6E6460' }}
            >
              Items Sold
            </span>
            <div
              className="text-xl font-black font-mono mt-0.5"
              style={{ color: '#2B2523' }}
            >
              {totalPeriodItems}{' '}
              <span className="text-xs font-normal" style={{ color: '#6E6460' }}>
                units
              </span>
            </div>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded font-bold border"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            Volume
          </span>
        </div>

        <div
          className="p-4 rounded-xl border shadow-sm flex items-center justify-between"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6E6460' }}
            >
              Average Order
            </span>
            <div
              className="text-xl font-black font-mono mt-0.5"
              style={{ color: '#6B1E2B' }}
            >
              {settings.currency}{' '}
              {filteredSales.length > 0
                ? (totalPeriodRevenue / filteredSales.length).toFixed(2)
                : '0.00'}
            </div>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded font-bold border"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            Avg
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="p-4 rounded-2xl border shadow-sm space-y-3"
        style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterPeriod(tab.id as any)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  backgroundColor: filterPeriod === tab.id ? '#6B1E2B' : '#FFF8E7',
                  color: filterPeriod === tab.id ? '#FFFFFF' : '#2B2523',
                  border: '1px solid #E6DCCB',
                }}
              >
                {tab.label}
              </button>
            ))}
            {currentUser?.role === 'cashier' && (
              <button
                type="button"
                onClick={() => setOnlyMySales(!onlyMySales)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  backgroundColor: onlyMySales ? '#6B1E2B' : '#FFF8E7',
                  color: onlyMySales ? '#FFFFFF' : '#6B1E2B',
                  border: '1px solid #6B1E2B',
                }}
              >
                {onlyMySales ? '✓ Showing My Sales' : 'Show All Store Sales'}
              </button>
            )}
          </div>

          {/* Search box and Reset Filters */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction #, cashier, or product..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border rounded-xl outline-none"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              />
            </div>
            {(filterPeriod !== 'all' || searchQuery !== '' || onlyMySales) && (
              <button
                type="button"
                onClick={() => {
                  setFilterPeriod('all');
                  setSearchQuery('');
                  setOnlyMySales(false);
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer hover:bg-neutral-100 whitespace-nowrap"
                style={{
                  borderColor: '#E6DCCB',
                  color: '#6B1E2B',
                  backgroundColor: '#FFF8E7',
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Custom date range inputs */}
        {filterPeriod === 'custom' && (
          <div
            className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs"
            style={{ borderColor: '#E6DCCB' }}
          >
            <span className="font-semibold" style={{ color: '#2B2523' }}>
              Date Range:
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border rounded-lg text-xs"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              />
              <span style={{ color: '#6E6460' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border rounded-lg text-xs"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sales Transactions Table */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#6E6460',
                }}
              >
                <th className="py-3 px-4">Transaction #</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: '#E6DCCB' }}>
              {filteredSales.map((sale) => {
                const sDate = new Date(sale.createdAt);

                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-[#FFF8E7]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className="font-mono font-bold text-xs px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: '#FFF8E7',
                            borderColor: '#E6DCCB',
                            color: '#6B1E2B',
                          }}
                        >
                          {sale.receiptNumber}
                        </span>
                        {sale.isBacklog && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            Back-log
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#2B2523' }}>
                      <div className="font-bold text-amber-950">
                        {sale.ethiopianDate || formatEthiopianDate(sale.createdAt)}
                      </div>
                      <div className="text-[11px]" style={{ color: '#6E6460' }}>
                        {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • G.C.: {sDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold" style={{ color: '#2B2523' }}>
                      {sale.cashierName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium border"
                        style={{
                          backgroundColor: '#FFF8E7',
                          borderColor: '#E6DCCB',
                          color: '#2B2523',
                        }}
                      >
                        {sale.paymentMethod === 'cash' ? (
                          <Banknote className="w-3 h-3" style={{ color: '#6B1E2B' }} />
                        ) : sale.paymentMethod === 'bank_transfer' ? (
                          <Building className="w-3 h-3" style={{ color: '#6B1E2B' }} />
                        ) : (
                          <CreditCard className="w-3 h-3 text-neutral-500" />
                        )}
                        <span className="capitalize">{sale.paymentMethod.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs">
                      <span className="font-bold" style={{ color: '#2B2523' }}>
                        {sale.items.reduce((a, b) => a + b.quantity, 0)}
                      </span>{' '}
                      <span style={{ color: '#6E6460' }}>({sale.items.length} types)</span>
                    </td>
                    <td
                      className="py-3 px-4 text-right font-mono font-bold"
                      style={{ color: '#6B1E2B' }}
                    >
                      {settings.currency} {sale.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                          style={{ color: '#6E6460' }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                    <p className="text-sm">No sales records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTION DETAILS MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border"
            style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
          >
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: '#6B1E2B' }}
            >
              <div>
                <h3 className="font-bold text-lg">Transaction Details</h3>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-amber-200 font-mono">ID: {selectedSale.receiptNumber}</p>
                  {selectedSale.isBacklog && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      Back-log
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div
                className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                }}
              >
                <div>
                  <span style={{ color: '#6E6460' }}>Ethiopian Date (ዓ.ም):</span>
                  <div className="font-bold text-amber-900">
                    {selectedSale.ethiopianDate || formatEthiopianDate(selectedSale.createdAt, { includeTime: true })}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    G.C.: {new Date(selectedSale.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6E6460' }}>Cashier:</span>
                  <div className="font-bold" style={{ color: '#2B2523' }}>
                    {selectedSale.cashierName}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6E6460' }}>Payment Method:</span>
                  <div className="font-bold uppercase" style={{ color: '#2B2523' }}>
                    {selectedSale.paymentMethod}
                  </div>
                </div>
                {selectedSale.paymentMethod === 'cash' && (
                  <div>
                    <span style={{ color: '#6E6460' }}>Change Given:</span>
                    <div className="font-bold" style={{ color: '#6B1E2B' }}>
                      {settings.currency} {selectedSale.change.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: '#6E6460' }}
                >
                  Items Purchased ({selectedSale.items.length})
                </h4>
                <div
                  className="border rounded-xl overflow-hidden divide-y max-h-56 overflow-y-auto"
                  style={{ borderColor: '#E6DCCB' }}
                >
                  {selectedSale.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 flex items-center justify-between text-xs"
                      style={{ backgroundColor: '#FFFDF8' }}
                    >
                      <div>
                        <div className="font-bold" style={{ color: '#2B2523' }}>
                          {item.productName}
                        </div>
                        <div className="text-[11px]" style={{ color: '#6E6460' }}>
                          Code: <span className="font-mono font-bold" style={{ color: '#6B1E2B' }}>{item.productCode}</span> • Qty: {item.quantity} × {settings.currency} {item.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-mono font-bold" style={{ color: '#6B1E2B' }}>
                        {settings.currency} {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div
                className="space-y-1 pt-2 border-t text-xs"
                style={{ borderColor: '#E6DCCB' }}
              >
                <div className="flex justify-between" style={{ color: '#6E6460' }}>
                  <span>Subtotal:</span>
                  <span>{settings.currency} {selectedSale.subtotal.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between" style={{ color: '#6B1E2B' }}>
                    <span>Discount:</span>
                    <span>-{settings.currency} {selectedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between text-base font-black pt-1 border-t"
                  style={{ borderColor: '#E6DCCB', color: '#2B2523' }}
                >
                  <span>Total Paid:</span>
                  <span className="font-mono" style={{ color: '#6B1E2B' }}>
                    {settings.currency} {selectedSale.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="w-full py-2.5 border rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
