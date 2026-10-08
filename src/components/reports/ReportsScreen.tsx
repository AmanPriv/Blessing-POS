import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Award,
  FileSpreadsheet,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  Filter,
  Search,
  Printer,
  Eye,
  X,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle,
  Percent,
} from 'lucide-react';
import { Product, Sale, AppSettings, SHOP_NAME } from '../../types';
import * as XLSX from 'xlsx';

interface ReportsScreenProps {
  products: Product[];
  sales: Sale[];
  settings: AppSettings;
}

type ReportMode = 'sales_report' | 'analytics';
type RangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'all'
  | 'custom';

type SalesReportSubView = 'transactions' | 'products' | 'daily';

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  products,
  sales,
  settings,
}) => {
  // Main view mode: 'sales_report' (Sales Report with Range) or 'analytics' (Analytics Overview)
  const [reportMode, setReportMode] = useState<ReportMode>('sales_report');

  // Sales Report with Range State
  const [rangePreset, setRangePreset] = useState<RangePreset>('thisMonth');
  
  // Format local date YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPresetDates = (preset: RangePreset): { start: string; end: string } => {
    const now = new Date();
    if (preset === 'today') {
      const t = formatDateLocal(now);
      return { start: t, end: t };
    }
    if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDateLocal(y);
      return { start: yStr, end: yStr };
    }
    if (preset === 'last7days') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 6);
      return { start: formatDateLocal(d7), end: formatDateLocal(now) };
    }
    if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDateLocal(firstDay), end: formatDateLocal(now) };
    }
    if (preset === 'lastMonth') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: formatDateLocal(firstDayLastMonth), end: formatDateLocal(lastDayLastMonth) };
    }
    if (preset === 'thisYear') {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      return { start: formatDateLocal(firstDayYear), end: formatDateLocal(now) };
    }
    return { start: '', end: '' }; // 'all' or 'custom'
  };

  const initialRange = getPresetDates('thisMonth');
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'bank_transfer' | 'other'>('all');
  const [cashierFilter, setCashierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subView, setSubView] = useState<SalesReportSubView>('transactions');
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | null>(null);

  // Analytics Overview timeframe
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'all' | 'today' | 'month'>('all');

  // Handle Preset Change
  const handleSelectPreset = (preset: RangePreset) => {
    setRangePreset(preset);
    if (preset !== 'custom' && preset !== 'all') {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Distinct cashiers in dataset
  const cashiers = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.cashierName) set.add(s.cashierName);
    });
    return Array.from(set);
  }, [sales]);

  // Filter sales for the Sales Report based on date range, cashier, payment method & search
  const filteredSalesForReport = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);

      if (startDate) {
        const startD = new Date(`${startDate}T00:00:00`);
        if (saleDate < startD) return false;
      }
      if (endDate) {
        const endD = new Date(`${endDate}T23:59:59.999`);
        if (saleDate > endD) return false;
      }

      if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) {
        return false;
      }

      if (cashierFilter !== 'all' && sale.cashierName !== cashierFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesReceipt = sale.receiptNumber.toLowerCase().includes(q);
        const matchesCashier = sale.cashierName.toLowerCase().includes(q);
        const matchesItem = sale.items.some(
          (i) => i.productName.toLowerCase().includes(q) || i.productCode.toLowerCase().includes(q)
        );
        if (!matchesReceipt && !matchesCashier && !matchesItem) return false;
      }

      return true;
    });
  }, [sales, startDate, endDate, paymentFilter, cashierFilter, searchQuery]);

  // Calculated Metrics for the Sales Report Range
  const reportTotalRevenue = filteredSalesForReport.reduce((acc, s) => acc + s.grandTotal, 0);
  const reportTotalSubtotal = filteredSalesForReport.reduce((acc, s) => acc + s.subtotal, 0);
  const reportTotalDiscounts = filteredSalesForReport.reduce((acc, s) => acc + (s.discount || 0), 0);
  const reportTotalTransactions = filteredSalesForReport.length;
  const reportTotalUnitsSold = filteredSalesForReport.reduce(
    (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.quantity, 0),
    0
  );
  const reportAvgOrderValue = reportTotalTransactions > 0 ? reportTotalRevenue / reportTotalTransactions : 0;

  // Profit calculation for filtered sales
  let reportTotalProfit = 0;
  let reportTotalCost = 0;
  filteredSalesForReport.forEach((s) => {
    s.items.forEach((item) => {
      const cost = (item.costPrice || 0) * item.quantity;
      reportTotalCost += cost;
      if (item.costPrice > 0) {
        reportTotalProfit += (item.unitPrice - item.costPrice) * item.quantity;
      } else {
        reportTotalProfit += item.subtotal;
      }
    });
  });
  const reportNetProfit = Math.max(0, reportTotalProfit - reportTotalDiscounts);
  const reportProfitMargin = reportTotalRevenue > 0 ? (reportNetProfit / reportTotalRevenue) * 100 : 0;

  // Breakdown by payment method
  const cashSales = filteredSalesForReport
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.grandTotal, 0);
  const transferSales = filteredSalesForReport
    .filter((s) => s.paymentMethod === 'bank_transfer')
    .reduce((acc, s) => acc + s.grandTotal, 0);
  const otherSales = filteredSalesForReport
    .filter((s) => s.paymentMethod === 'other')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  // Itemized product sales breakdown in range
  const productSalesMap = useMemo(() => {
    const map: Record<
      string,
      {
        productCode: string;
        name: string;
        category: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    > = {};

    filteredSalesForReport.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.productId || item.productCode;
        if (!map[key]) {
          const matchedProd = products.find(
            (p) => p.id === item.productId || p.productCode === item.productCode
          );
          map[key] = {
            productCode: item.productCode,
            name: item.productName,
            category: matchedProd?.category || 'General',
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }
        const itemCost = (item.costPrice || 0) * item.quantity;
        map[key].quantity += item.quantity;
        map[key].revenue += item.subtotal;
        map[key].cost += itemCost;
        if (item.costPrice > 0) {
          map[key].profit += (item.unitPrice - item.costPrice) * item.quantity;
        } else {
          map[key].profit += item.subtotal;
        }
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSalesForReport, products]);

  // Daily Summary Breakdown in range
  const dailyBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        date: string;
        dayName: string;
        count: number;
        units: number;
        revenue: number;
        discount: number;
        profit: number;
      }
    > = {};

    filteredSalesForReport.forEach((sale) => {
      const d = sale.createdAt.slice(0, 10);
      if (!map[d]) {
        const dateObj = new Date(sale.createdAt);
        const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
        map[d] = {
          date: d,
          dayName,
          count: 0,
          units: 0,
          revenue: 0,
          discount: 0,
          profit: 0,
        };
      }
      map[d].count += 1;
      map[d].discount += sale.discount || 0;
      map[d].revenue += sale.grandTotal;

      let saleProfit = 0;
      sale.items.forEach((item) => {
        map[d].units += item.quantity;
        if (item.costPrice > 0) {
          saleProfit += (item.unitPrice - item.costPrice) * item.quantity;
        } else {
          saleProfit += item.subtotal;
        }
      });
      map[d].profit += Math.max(0, saleProfit - (sale.discount || 0));
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSalesForReport]);

  // Overall Catalog Valuation
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const retailValuation = products.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0);
  const costValuation = products.reduce((acc, p) => acc + (p.costPrice || 0) * p.stockQuantity, 0);
  const lowStockCount = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  // Export Range Sales Report to Excel
  const handleExportSalesReportExcel = () => {
    const rangeDescription =
      startDate && endDate
        ? `${startDate} to ${endDate}`
        : startDate
        ? `From ${startDate}`
        : endDate
        ? `Until ${endDate}`
        : 'All Time';

    // Sheet 1: Summary KPI Sheet
    const summarySheetData = [
      { Metric: 'Store Name', Value: SHOP_NAME },
      { Metric: 'Report Type', Value: 'Sales Report with Range' },
      { Metric: 'Date Range', Value: rangeDescription },
      { Metric: 'Generated At', Value: new Date().toLocaleString() },
      { Metric: 'Total Gross Sales', Value: `${settings.currency} ${reportTotalRevenue.toFixed(2)}` },
      { Metric: 'Total Subtotal', Value: `${settings.currency} ${reportTotalSubtotal.toFixed(2)}` },
      { Metric: 'Total Discounts Given', Value: `${settings.currency} ${reportTotalDiscounts.toFixed(2)}` },
      { Metric: 'Estimated Net Profit', Value: `${settings.currency} ${reportNetProfit.toFixed(2)}` },
      { Metric: 'Net Profit Margin', Value: `${reportProfitMargin.toFixed(1)}%` },
      { Metric: 'Total Transactions (Orders)', Value: reportTotalTransactions },
      { Metric: 'Total Units Sold', Value: reportTotalUnitsSold },
      { Metric: 'Average Order Value', Value: `${settings.currency} ${reportAvgOrderValue.toFixed(2)}` },
      { Metric: 'Cash Sales', Value: `${settings.currency} ${cashSales.toFixed(2)}` },
      { Metric: 'Bank Transfer Sales', Value: `${settings.currency} ${transferSales.toFixed(2)}` },
      { Metric: 'Other Payment Sales', Value: `${settings.currency} ${otherSales.toFixed(2)}` },
    ];

    // Sheet 2: Transactions
    const transactionsSheetData = filteredSalesForReport.map((s) => ({
      'Receipt #': s.receiptNumber,
      'Date & Time': new Date(s.createdAt).toLocaleString(),
      'Cashier': s.cashierName,
      'Payment Method': s.paymentMethod.toUpperCase(),
      'Items Count': s.items.reduce((acc, item) => acc + item.quantity, 0),
      'Items Detail': s.items.map((i) => `${i.productName} (${i.productCode}) x${i.quantity}`).join('; '),
      'Subtotal': s.subtotal,
      'Discount': s.discount || 0,
      'Grand Total': s.grandTotal,
      'Payment Received': s.amountReceived,
      'Change Given': s.change,
    }));

    // Sheet 3: Itemized Products Sold
    const productsSheetData = productSalesMap.map((p) => ({
      'Product Code': p.productCode,
      'Product Name': p.name,
      'Category': p.category,
      'Units Sold': p.quantity,
      'Gross Revenue': p.revenue,
      'Total Cost': p.cost,
      'Net Profit': p.profit,
      'Profit Margin %': p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) + '%' : '0%',
    }));

    // Sheet 4: Daily Summary
    const dailySheetData = dailyBreakdown.map((d) => ({
      'Date': d.date,
      'Day': d.dayName,
      'Transactions Count': d.count,
      'Units Sold': d.units,
      'Total Revenue': d.revenue,
      'Discounts': d.discount,
      'Net Profit': d.profit,
      'Avg Order Value': d.count > 0 ? (d.revenue / d.count).toFixed(2) : 0,
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
    const wsTxn = XLSX.utils.json_to_sheet(transactionsSheetData);
    const wsProds = XLSX.utils.json_to_sheet(productsSheetData);
    const wsDaily = XLSX.utils.json_to_sheet(dailySheetData);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Sales Summary');
    XLSX.utils.book_append_sheet(workbook, wsTxn, 'Transactions');
    XLSX.utils.book_append_sheet(workbook, wsProds, 'Products Sold');
    XLSX.utils.book_append_sheet(workbook, wsDaily, 'Daily Breakdown');

    const cleanStart = startDate || 'all';
    const cleanEnd = endDate || 'now';
    XLSX.writeFile(
      workbook,
      `blessing_shop_sales_report_${cleanStart}_to_${cleanEnd}.xlsx`
    );
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: '#6B1E2B' }}
            >
              Reports &amp; Analytics
            </h1>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
              style={{
                backgroundColor: '#F7EBED',
                borderColor: '#E6DCCB',
                color: '#6B1E2B',
              }}
            >
              Blessing Shop
            </span>
          </div>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6E6460' }}>
            Detailed sales reports with custom date range, financial margins, and inventory valuation.
          </p>
        </div>

        {/* View Switcher: Sales Report vs Analytics */}
        <div
          className="p-1 rounded-xl flex items-center space-x-1 border shadow-xs"
          style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
        >
          <button
            type="button"
            onClick={() => setReportMode('sales_report')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            style={{
              backgroundColor: reportMode === 'sales_report' ? '#6B1E2B' : 'transparent',
              color: reportMode === 'sales_report' ? '#FFFFFF' : '#2B2523',
            }}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Sales Report (With Range)</span>
          </button>
          <button
            type="button"
            onClick={() => setReportMode('analytics')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            style={{
              backgroundColor: reportMode === 'analytics' ? '#6B1E2B' : 'transparent',
              color: reportMode === 'analytics' ? '#FFFFFF' : '#2B2523',
            }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics &amp; KPIs</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SALES REPORT WITH RANGE VIEW                                               */}
      {/* ========================================================================= */}
      {reportMode === 'sales_report' && (
        <div className="space-y-6">
          {/* Controls Card: Date Range & Filter Bar */}
          <div
            className="p-5 rounded-2xl border shadow-sm space-y-4 print:hidden"
            style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
          >
            {/* Range Presets Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: '#E6DCCB' }}>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" style={{ color: '#6B1E2B' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2B2523' }}>
                  Select Sales Date Range:
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last7days', label: 'Last 7 Days' },
                  { id: 'thisMonth', label: 'This Month' },
                  { id: 'lastMonth', label: 'Last Month' },
                  { id: 'thisYear', label: 'This Year' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: 'Custom Range' },
                ].map((p) => {
                  const isActive = rangePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id as RangePreset)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border"
                      style={{
                        backgroundColor: isActive ? '#6B1E2B' : '#FFF8E7',
                        borderColor: isActive ? '#6B1E2B' : '#E6DCCB',
                        color: isActive ? '#FFFFFF' : '#2B2523',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Range Inputs & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setRangePreset('custom');
                    }}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-medium outline-none transition-colors"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setRangePreset('custom');
                    }}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-medium outline-none transition-colors"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                </div>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
                  Payment Method
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border rounded-xl font-medium outline-none transition-colors cursor-pointer"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash Only</option>
                  <option value="bank_transfer">Bank Transfer Only</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Cashier Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
                  Cashier / Staff
                </label>
                <select
                  value={cashierFilter}
                  onChange={(e) => setCashierFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl font-medium outline-none transition-colors cursor-pointer"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="all">All Cashiers</option>
                  {cashiers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search query */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
                  Search Records
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Receipt # or product..."
                    className="w-full pl-8 pr-3 py-2 text-xs border rounded-xl font-medium outline-none transition-colors"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Bar: Export Excel, Print, Clear Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: '#E6DCCB' }}>
              <div className="flex items-center space-x-2 text-xs" style={{ color: '#6E6460' }}>
                <span className="font-semibold">Showing:</span>
                <span className="font-bold font-mono px-2 py-0.5 rounded-md border" style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB', color: '#6B1E2B' }}>
                  {filteredSalesForReport.length} sales found
                </span>
                {startDate && endDate && (
                  <span className="text-[11px]">
                    ({startDate} to {endDate})
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {(startDate || endDate || paymentFilter !== 'all' || cashierFilter !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRangePreset('all');
                      setStartDate('');
                      setEndDate('');
                      setPaymentFilter('all');
                      setCashierFilter('all');
                      setSearchQuery('');
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#6B1E2B',
                    }}
                    title="Clear all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 border rounded-xl font-bold text-xs transition-all cursor-pointer"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <Printer className="w-3.5 h-3.5" style={{ color: '#6B1E2B' }} />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSalesReportExcel}
                  className="flex items-center space-x-1.5 px-4 py-2 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer active:scale-95"
                  style={{
                    backgroundColor: '#6B1E2B',
                    boxShadow: '0 4px 12px rgba(107, 30, 43, 0.25)',
                  }}
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-200" />
                  <span>Export Sales Report (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Printable Report Header */}
          <div className="hidden print:block p-4 border-b space-y-2" style={{ borderColor: '#6B1E2B' }}>
            <h1 className="text-2xl font-black" style={{ color: '#6B1E2B' }}>{SHOP_NAME} - Official Sales Report</h1>
            <p className="text-xs">
              Period: {startDate ? startDate : 'Start'} to {endDate ? endDate : 'End'} • Generated on {new Date().toLocaleString()}
            </p>
          </div>

          {/* KPI Summary Cards for Selected Date Range */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Gross Revenue */}
            <div
              className="p-5 rounded-2xl border shadow-sm"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#6E6460' }}
                >
                  Gross Sales Revenue
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#F7EBED', color: '#6B1E2B' }}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl sm:text-3xl font-black font-mono"
                style={{ color: '#6B1E2B' }}
              >
                {settings.currency} {reportTotalRevenue.toFixed(2)}
              </div>
              <div className="text-xs mt-1 flex items-center justify-between" style={{ color: '#6E6460' }}>
                <span>Subtotal: {settings.currency} {reportTotalSubtotal.toFixed(2)}</span>
                {reportTotalDiscounts > 0 && (
                  <span className="font-bold text-[#6B1E2B]">
                    Disc: -{settings.currency} {reportTotalDiscounts.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Estimated Net Profit */}
            <div
              className="p-5 rounded-2xl border shadow-sm"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#6E6460' }}
                >
                  Estimated Net Profit
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                >
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl sm:text-3xl font-black font-mono"
                style={{ color: '#2B2523' }}
              >
                {settings.currency} {reportNetProfit.toFixed(2)}
              </div>
              <div className="text-xs mt-1 flex items-center justify-between" style={{ color: '#6E6460' }}>
                <span>Margin:</span>
                <span className="font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FFF8E7] text-[#6B1E2B]">
                  {reportProfitMargin.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Transactions Count & Units */}
            <div
              className="p-5 rounded-2xl border shadow-sm"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#6E6460' }}
                >
                  Orders &amp; Volume
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#FFF8E7', color: '#2B2523' }}
                >
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl sm:text-3xl font-black font-mono"
                style={{ color: '#2B2523' }}
              >
                {reportTotalTransactions} <span className="text-sm font-semibold text-neutral-500">Orders</span>
              </div>
              <div className="text-xs mt-1" style={{ color: '#6E6460' }}>
                <span className="font-bold font-mono text-[#6B1E2B]">{reportTotalUnitsSold}</span> units sold across range
              </div>
            </div>

            {/* Average Ticket & Payment breakdown */}
            <div
              className="p-5 rounded-2xl border shadow-sm"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#6E6460' }}
                >
                  Average Ticket
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#FFF8E7', color: '#2B2523' }}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div
                className="text-2xl sm:text-3xl font-black font-mono"
                style={{ color: '#2B2523' }}
              >
                {settings.currency} {reportAvgOrderValue.toFixed(2)}
              </div>
              <div className="text-[11px] mt-1 space-x-1" style={{ color: '#6E6460' }}>
                <span>Cash: {settings.currency} {cashSales.toFixed(0)}</span>
                <span>•</span>
                <span>Transfer: {settings.currency} {transferSales.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Sub-View Navigation Tabs: Transactions Ledger | Products Sold | Daily Breakdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div
              className="p-1 rounded-xl flex items-center space-x-1 border w-fit"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <button
                type="button"
                onClick={() => setSubView('transactions')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: subView === 'transactions' ? '#6B1E2B' : 'transparent',
                  color: subView === 'transactions' ? '#FFFFFF' : '#2B2523',
                }}
              >
                Transactions Ledger ({filteredSalesForReport.length})
              </button>
              <button
                type="button"
                onClick={() => setSubView('products')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: subView === 'products' ? '#6B1E2B' : 'transparent',
                  color: subView === 'products' ? '#FFFFFF' : '#2B2523',
                }}
              >
                Itemized Products Sold ({productSalesMap.length})
              </button>
              <button
                type="button"
                onClick={() => setSubView('daily')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: subView === 'daily' ? '#6B1E2B' : 'transparent',
                  color: subView === 'daily' ? '#FFFFFF' : '#2B2523',
                }}
              >
                Daily Sales Trend ({dailyBreakdown.length} days)
              </button>
            </div>

            <div className="text-xs font-semibold" style={{ color: '#6E6460' }}>
              Range: {startDate ? startDate : 'All'} &rarr; {endDate ? endDate : 'Present'}
            </div>
          </div>

          {/* SUB-VIEW 1: TRANSACTIONS LEDGER */}
          {subView === 'transactions' && (
            <div
              className="rounded-2xl border shadow-sm overflow-hidden"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5" style={{ color: '#6B1E2B' }} />
                  <h3 className="font-bold text-sm sm:text-base" style={{ color: '#2B2523' }}>
                    Sales Transactions in Range
                  </h3>
                </div>
                <span className="text-xs font-semibold" style={{ color: '#6E6460' }}>
                  Total: {filteredSalesForReport.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className="border-b uppercase font-bold text-[11px] tracking-wider"
                      style={{
                        backgroundColor: '#FFFDF8',
                        borderColor: '#E6DCCB',
                        color: '#6E6460',
                      }}
                    >
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Cashier</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-center print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium" style={{ borderColor: '#E6DCCB' }}>
                    {filteredSalesForReport.map((sale) => (
                      <tr
                        key={sale.id}
                        className="hover:bg-[#FFF8E7] transition-colors"
                        style={{ color: '#2B2523' }}
                      >
                        <td className="py-3 px-4 font-mono font-bold" style={{ color: '#6B1E2B' }}>
                          {sale.receiptNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap" style={{ color: '#6E6460' }}>
                          {new Date(sale.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4">{sale.cashierName}</td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              backgroundColor:
                                sale.paymentMethod === 'cash'
                                  ? '#FEF3C7'
                                  : sale.paymentMethod === 'bank_transfer'
                                  ? '#F7EBED'
                                  : '#FFF8E7',
                              borderColor: '#E6DCCB',
                              color:
                                sale.paymentMethod === 'cash'
                                  ? '#92400E'
                                  : '#6B1E2B',
                            }}
                          >
                            {sale.paymentMethod === 'bank_transfer' ? 'Transfer' : sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={sale.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}>
                          <span className="font-semibold text-neutral-800">
                            {sale.items.reduce((a, b) => a + b.quantity, 0)} items:
                          </span>{' '}
                          <span className="text-neutral-500">
                            {sale.items.map((i) => `${i.productName} (${i.productCode})`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-600">
                          {settings.currency} {sale.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#6B1E2B]">
                          {sale.discount > 0 ? `-${settings.currency} ${sale.discount.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-base" style={{ color: '#6B1E2B' }}>
                          {settings.currency} {sale.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForModal(sale)}
                            className="p-1.5 rounded-lg border hover:bg-[#FFF8E7] transition-colors cursor-pointer"
                            style={{ borderColor: '#E6DCCB', color: '#6B1E2B' }}
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredSalesForReport.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-neutral-400">
                          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                          <p className="text-sm font-semibold">No sales found for the selected range and filters.</p>
                          <p className="text-xs mt-1 text-neutral-400">
                            Try expanding your date range or clearing search filters above.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: ITEMIZED PRODUCTS SOLD */}
          {subView === 'products' && (
            <div
              className="rounded-2xl border shadow-sm overflow-hidden"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
              >
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" style={{ color: '#6B1E2B' }} />
                  <h3 className="font-bold text-sm sm:text-base" style={{ color: '#2B2523' }}>
                    Itemized Products Sold in Range
                  </h3>
                </div>
                <span className="text-xs font-semibold" style={{ color: '#6E6460' }}>
                  {productSalesMap.length} unique products sold
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className="border-b uppercase font-bold text-[11px] tracking-wider"
                      style={{
                        backgroundColor: '#FFFDF8',
                        borderColor: '#E6DCCB',
                        color: '#6E6460',
                      }}
                    >
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Units Sold</th>
                      <th className="py-3 px-4 text-right">Gross Revenue</th>
                      <th className="py-3 px-4 text-right">Cost of Goods</th>
                      <th className="py-3 px-4 text-right">Net Profit</th>
                      <th className="py-3 px-4 text-right">Margin %</th>
                      <th className="py-3 px-4 text-right">Sales Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium" style={{ borderColor: '#E6DCCB' }}>
                    {productSalesMap.map((item, idx) => {
                      const marginPct = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                      const sharePct = reportTotalRevenue > 0 ? (item.revenue / reportTotalRevenue) * 100 : 0;

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-[#FFF8E7] transition-colors"
                          style={{ color: '#2B2523' }}
                        >
                          <td className="py-3 px-4 font-mono font-bold" style={{ color: '#6B1E2B' }}>
                            {item.productCode}
                          </td>
                          <td className="py-3 px-4 font-bold">{item.name}</td>
                          <td className="py-3 px-4 text-neutral-500">{item.category}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-sm" style={{ color: '#2B2523' }}>
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: '#6B1E2B' }}>
                            {settings.currency} {item.revenue.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-neutral-500">
                            {settings.currency} {item.cost.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: '#2B2523' }}>
                            {settings.currency} {item.profit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: '#F7EBED', color: '#6B1E2B' }}
                            >
                              {marginPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-neutral-500">
                            {sharePct.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}

                    {productSalesMap.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-neutral-400">
                          <Package className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                          <p className="text-sm font-semibold">No product sales in this timeframe.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: DAILY SALES SUMMARY */}
          {subView === 'daily' && (
            <div
              className="rounded-2xl border shadow-sm overflow-hidden"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
              >
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5" style={{ color: '#6B1E2B' }} />
                  <h3 className="font-bold text-sm sm:text-base" style={{ color: '#2B2523' }}>
                    Daily Sales Performance Breakdown
                  </h3>
                </div>
                <span className="text-xs font-semibold" style={{ color: '#6E6460' }}>
                  {dailyBreakdown.length} active business days
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className="border-b uppercase font-bold text-[11px] tracking-wider"
                      style={{
                        backgroundColor: '#FFFDF8',
                        borderColor: '#E6DCCB',
                        color: '#6E6460',
                      }}
                    >
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-center">Units Sold</th>
                      <th className="py-3 px-4 text-right">Discounts</th>
                      <th className="py-3 px-4 text-right">Gross Revenue</th>
                      <th className="py-3 px-4 text-right">Est. Profit</th>
                      <th className="py-3 px-4 text-right">Avg Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium" style={{ borderColor: '#E6DCCB' }}>
                    {dailyBreakdown.map((row) => (
                      <tr
                        key={row.date}
                        className="hover:bg-[#FFF8E7] transition-colors"
                        style={{ color: '#2B2523' }}
                      >
                        <td className="py-3 px-4 font-mono font-bold" style={{ color: '#6B1E2B' }}>
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-semibold">{row.dayName}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{row.count}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{row.units}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#6B1E2B]">
                          {row.discount > 0 ? `-${settings.currency} ${row.discount.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm" style={{ color: '#6B1E2B' }}>
                          {settings.currency} {row.revenue.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: '#2B2523' }}>
                          {settings.currency} {row.profit.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-600">
                          {settings.currency} {(row.count > 0 ? row.revenue / row.count : 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {dailyBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-400">
                          <Calendar className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                          <p className="text-sm font-semibold">No daily sales in this range.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANALYTICS & OVERVIEW VIEW                                                 */}
      {/* ========================================================================= */}
      {reportMode === 'analytics' && (
        <div className="space-y-6">
          {/* Timeframe selector header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border" style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}>
            <div>
              <h2 className="font-bold text-base" style={{ color: '#2B2523' }}>
                Executive Analytics Overview
              </h2>
              <p className="text-xs" style={{ color: '#6E6460' }}>
                High-level business performance, top-selling inventory, and shelf valuation.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div
                className="p-1 rounded-xl flex items-center space-x-1 border"
                style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB' }}
              >
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'month', label: 'Last 30 Days' },
                  { id: 'today', label: 'Today' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAnalyticsTimeframe(t.id as any)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    style={{
                      backgroundColor: analyticsTimeframe === t.id ? '#6B1E2B' : 'transparent',
                      color: analyticsTimeframe === t.id ? '#FFFFFF' : '#2B2523',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setReportMode('sales_report');
                }}
                className="flex items-center space-x-1 px-3 py-2 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                style={{ backgroundColor: '#6B1E2B' }}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Open Detailed Sales Report</span>
              </button>
            </div>
          </div>

          {/* 2-Columns: Best Selling Products & Inventory Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Selling Products */}
            <div
              className="rounded-2xl border shadow-sm overflow-hidden flex flex-col"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: '#E6DCCB', backgroundColor: '#FFF8E7' }}
              >
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" style={{ color: '#6B1E2B' }} />
                  <h2 className="font-bold text-base" style={{ color: '#2B2523' }}>
                    Top-Selling Catalog Products
                  </h2>
                </div>
                <span className="text-xs font-semibold" style={{ color: '#6E6460' }}>
                  Ranked by units
                </span>
              </div>

              <div className="divide-y flex-1 overflow-y-auto max-h-[420px]" style={{ borderColor: '#E6DCCB' }}>
                {productSalesMap.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between hover:bg-[#FFF8E7] transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center text-white"
                        style={{ backgroundColor: idx < 3 ? '#6B1E2B' : '#6E6460' }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: '#2B2523' }}>
                          {item.name}
                        </div>
                        <div className="text-xs font-mono font-bold" style={{ color: '#6B1E2B' }}>
                          Code: {item.productCode} • {item.category}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm" style={{ color: '#2B2523' }}>
                        {item.quantity} units sold
                      </div>
                      <div className="text-xs font-mono" style={{ color: '#6E6460' }}>
                        Rev: {settings.currency} {item.revenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                {productSalesMap.length === 0 && (
                  <div className="p-12 text-center text-neutral-400">
                    <Award className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                    <p className="text-sm">No sales in this timeframe yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Status Breakdown */}
            <div
              className="rounded-2xl border shadow-sm p-6 space-y-6"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
            >
              <div
                className="flex items-center space-x-2 border-b pb-3"
                style={{ borderColor: '#E6DCCB' }}
              >
                <Layers className="w-5 h-5" style={{ color: '#6B1E2B' }} />
                <h2 className="font-bold text-base" style={{ color: '#2B2523' }}>
                  Shelf Inventory Valuation
                </h2>
              </div>

              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl border flex justify-between items-center"
                  style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB' }}
                >
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#6E6460' }}>
                      Total Active Products
                    </span>
                    <div className="text-xl font-black font-mono" style={{ color: '#2B2523' }}>
                      {totalProducts}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-lg border font-bold"
                    style={{
                      backgroundColor: '#FFFDF8',
                      borderColor: '#E6DCCB',
                      color: '#6B1E2B',
                    }}
                  >
                    Catalog Items
                  </span>
                </div>

                <div
                  className="p-4 rounded-xl border flex justify-between items-center"
                  style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB' }}
                >
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#6E6460' }}>
                      Total Units on Shelf
                    </span>
                    <div className="text-xl font-black font-mono" style={{ color: '#2B2523' }}>
                      {totalStockUnits}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-lg border font-bold"
                    style={{
                      backgroundColor: '#FFFDF8',
                      borderColor: '#E6DCCB',
                      color: '#6B1E2B',
                    }}
                  >
                    Units on Hand
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: '#FEF3C7',
                      borderColor: '#FCD34D',
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#92400E]">
                      Low Stock Items
                    </span>
                    <div className="text-2xl font-black font-mono mt-1 text-[#92400E]">
                      {lowStockCount}
                    </div>
                    <p className="text-[11px] mt-1 text-[#92400E]">Needs reordering</p>
                  </div>

                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: '#FDF2F3',
                      borderColor: '#F5C6CB',
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B1E2B]">
                      Out of Stock Items
                    </span>
                    <div className="text-2xl font-black font-mono mt-1 text-[#6B1E2B]">
                      {outOfStockCount}
                    </div>
                    <p className="text-[11px] mt-1 text-[#6B1E2B]">Unavailable for sale</p>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border space-y-1.5 text-xs"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Retail Valuation:</span>
                    <span className="font-mono text-sm font-black" style={{ color: '#6B1E2B' }}>
                      {settings.currency} {retailValuation.toFixed(2)}
                    </span>
                  </div>
                  <div className="font-bold flex items-center justify-between">
                    <span>Cost Basis:</span>
                    <span className="font-mono text-sm" style={{ color: '#2B2523' }}>
                      {settings.currency} {costValuation.toFixed(2)}
                    </span>
                  </div>
                  <div className="font-bold flex items-center justify-between pt-1 border-t" style={{ borderColor: '#E6DCCB' }}>
                    <span>Potential Margin:</span>
                    <span className="font-mono text-sm font-black" style={{ color: '#6B1E2B' }}>
                      {settings.currency} {(retailValuation - costValuation).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRANSACTION RECEIPT MODAL                                                 */}
      {/* ========================================================================= */}
      {selectedSaleForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-lg w-full overflow-hidden border shadow-2xl animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
            }}
          >
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{
                backgroundColor: '#6B1E2B',
                borderColor: '#E6DCCB',
                color: '#FFFFFF',
              }}
            >
              <div>
                <h3 className="text-base font-black tracking-tight">{SHOP_NAME} - Receipt</h3>
                <p className="text-xs text-amber-200 font-mono">
                  Receipt #{selectedSaleForModal.receiptNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSaleForModal(null)}
                className="p-1 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                  <span style={{ color: '#6E6460' }}>Date &amp; Time:</span>
                  <div className="font-bold" style={{ color: '#2B2523' }}>
                    {new Date(selectedSaleForModal.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6E6460' }}>Cashier:</span>
                  <div className="font-bold" style={{ color: '#2B2523' }}>
                    {selectedSaleForModal.cashierName}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6E6460' }}>Payment Method:</span>
                  <div className="font-bold uppercase" style={{ color: '#2B2523' }}>
                    {selectedSaleForModal.paymentMethod}
                  </div>
                </div>
                {selectedSaleForModal.paymentMethod === 'cash' && (
                  <div>
                    <span style={{ color: '#6E6460' }}>Change Given:</span>
                    <div className="font-bold font-mono" style={{ color: '#6B1E2B' }}>
                      {settings.currency} {selectedSaleForModal.change.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Purchased */}
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: '#6E6460' }}
                >
                  Purchased Items ({selectedSaleForModal.items.length})
                </h4>
                <div
                  className="border rounded-xl overflow-hidden divide-y max-h-56 overflow-y-auto"
                  style={{ borderColor: '#E6DCCB' }}
                >
                  {selectedSaleForModal.items.map((item, idx) => (
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
                          Code: <span className="font-mono font-bold" style={{ color: '#6B1E2B' }}>{item.productCode}</span> • {item.quantity} × {settings.currency} {item.unitPrice.toFixed(2)}
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
                className="space-y-1.5 pt-2 border-t text-xs"
                style={{ borderColor: '#E6DCCB' }}
              >
                <div className="flex justify-between" style={{ color: '#6E6460' }}>
                  <span>Subtotal:</span>
                  <span className="font-mono">{settings.currency} {selectedSaleForModal.subtotal.toFixed(2)}</span>
                </div>
                {selectedSaleForModal.discount > 0 && (
                  <div className="flex justify-between" style={{ color: '#6B1E2B' }}>
                    <span>Discount:</span>
                    <span className="font-mono">-{settings.currency} {selectedSaleForModal.discount.toFixed(2)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between text-base font-black pt-1 border-t"
                  style={{ borderColor: '#E6DCCB', color: '#2B2523' }}
                >
                  <span>Grand Total:</span>
                  <span className="font-mono" style={{ color: '#6B1E2B' }}>
                    {settings.currency} {selectedSaleForModal.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSaleForModal(null)}
                  className="w-full py-2.5 border rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
