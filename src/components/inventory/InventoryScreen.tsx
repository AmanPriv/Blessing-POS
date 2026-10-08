import React, { useState } from 'react';
import {
  RefreshCw,
  Search,
  Plus,
  ArrowUpRight,
  History,
  FileSpreadsheet,
  Check,
  X,
  ArrowDownRight,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { Product, AppSettings, User, StockMovement } from '../../types';
import { storage } from '../../services/storage';
import { exportProductsToExcel } from '../../services/excelService';

interface InventoryScreenProps {
  products: Product[];
  settings: AppSettings;
  currentUser: User;
  onRefresh: () => void;
  quickRestockProduct?: Product | null;
  onClearQuickRestock?: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  settings,
  currentUser,
  onRefresh,
  quickRestockProduct,
  onClearQuickRestock,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(quickRestockProduct || null);
  const [quantityToAdd, setQuantityToAdd] = useState<string>('10');
  const [restockNote, setRestockNote] = useState<string>('');
  const [restockError, setRestockError] = useState<string | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(Boolean(quickRestockProduct));
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  React.useEffect(() => {
    if (quickRestockProduct && isAdmin) {
      setSelectedProduct(quickRestockProduct);
      setQuantityToAdd('10');
      setIsRestockModalOpen(true);
    }
  }, [quickRestockProduct, isAdmin]);

  const handleOpenRestock = (p: Product) => {
    if (!isAdmin) return;
    setSelectedProduct(p);
    setQuantityToAdd('10');
    setRestockNote('');
    setRestockError(null);
    setIsRestockModalOpen(true);
  };

  const handleCloseRestock = () => {
    setIsRestockModalOpen(false);
    setSelectedProduct(null);
    setRestockError(null);
    if (onClearQuickRestock) onClearQuickRestock();
  };

  const handleProcessRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setRestockError('Unauthorized: Cashiers cannot restock inventory.');
      return;
    }
    if (!selectedProduct) return;

    const qty = parseInt(quantityToAdd, 10);
    if (isNaN(qty) || qty <= 0) {
      setRestockError('Please enter a valid quantity greater than 0.');
      return;
    }

    const res = storage.restockProduct(selectedProduct.id, qty, restockNote, currentUser.role);
    if (!res.success) {
      setRestockError(res.message || 'Restock failed.');
      return;
    }

    handleCloseRestock();
    onRefresh();
  };

  const handleOpenHistory = () => {
    const movements = storage.getStockMovements();
    setStockMovements(movements);
    setIsHistoryModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    const isOut = p.stockQuantity === 0;
    const isLow = p.stockQuantity <= p.minStockThreshold && !isOut;
    const isIn = p.stockQuantity > p.minStockThreshold;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'OUT_OF_STOCK' && isOut) ||
      (statusFilter === 'LOW_STOCK' && isLow) ||
      (statusFilter === 'IN_STOCK' && isIn);

    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

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
            Inventory &amp; Stock Management
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6E6460' }}>
            Monitor on-hand quantities, restock shipments, and review audit history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenHistory}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 border rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            <History className="w-4 h-4" style={{ color: '#6B1E2B' }} />
            <span>Movement Logs</span>
          </button>
          <button
            onClick={() => exportProductsToExcel(products)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 border rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            <FileSpreadsheet className="w-4 h-4" style={{ color: '#6B1E2B' }} />
            <span>Export Stock</span>
          </button>
        </div>
      </div>

      {/* Filter and Status Counts */}
      <div
        className="p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, product name, or category..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl outline-none"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: statusFilter === 'ALL' ? '#6B1E2B' : '#FFF8E7',
              color: statusFilter === 'ALL' ? '#FFFFFF' : '#2B2523',
              border: '1px solid #E6DCCB',
            }}
          >
            All ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_STOCK')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: statusFilter === 'IN_STOCK' ? '#6B1E2B' : '#FFF8E7',
              color: statusFilter === 'IN_STOCK' ? '#FFFFFF' : '#2B2523',
              border: '1px solid #E6DCCB',
            }}
          >
            In Stock ({products.filter((p) => p.stockQuantity > p.minStockThreshold).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('LOW_STOCK')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: statusFilter === 'LOW_STOCK' ? '#B45309' : '#FEF3C7',
              color: statusFilter === 'LOW_STOCK' ? '#FFFFFF' : '#92400E',
              border: '1px solid #FCD34D',
            }}
          >
            Low Stock ({products.filter((p) => p.stockQuantity <= p.minStockThreshold && p.stockQuantity > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: statusFilter === 'OUT_OF_STOCK' ? '#6B1E2B' : '#FDF2F3',
              color: statusFilter === 'OUT_OF_STOCK' ? '#FFFFFF' : '#6B1E2B',
              border: '1px solid #F5C6CB',
            }}
          >
            Out of Stock ({products.filter((p) => p.stockQuantity === 0).length})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
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
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: '#E6DCCB' }}>
              {filteredProducts.map((p) => {
                const isOut = p.stockQuantity === 0;
                const isLow = p.stockQuantity <= p.minStockThreshold && !isOut;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-[#FFF8E7]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold" style={{ color: '#2B2523' }}>{p.name}</div>
                      <div className="text-xs" style={{ color: '#6E6460' }}>
                        Min Threshold: {p.minStockThreshold} {p.unit}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="font-mono font-bold text-xs px-2 py-1 rounded border"
                        style={{
                          backgroundColor: '#FFF8E7',
                          borderColor: '#E6DCCB',
                          color: '#6B1E2B',
                        }}
                      >
                        {p.productCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#6E6460' }}>
                      {p.category}
                    </td>
                    <td
                      className="py-3 px-4 text-right font-mono font-bold"
                      style={{ color: '#6B1E2B' }}
                    >
                      {settings.currency} {p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6E6460' }}>
                      {p.costPrice ? `${settings.currency} ${p.costPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="font-mono font-black text-base"
                        style={{
                          color: isOut ? '#6B1E2B' : isLow ? '#B45309' : '#2B2523',
                        }}
                      >
                        {p.stockQuantity}
                      </span>{' '}
                      <span className="text-xs font-normal" style={{ color: '#6E6460' }}>{p.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOut ? (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: '#FDF2F3',
                            color: '#6B1E2B',
                            borderColor: '#F5C6CB',
                          }}
                        >
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            borderColor: '#FCD34D',
                          }}
                        >
                          LOW STOCK
                        </span>
                      ) : (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: '#FFF8E7',
                            color: '#2B2523',
                            borderColor: '#E6DCCB',
                          }}
                        >
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAdmin ? (
                        <button
                          onClick={() => handleOpenRestock(p)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                          style={{ backgroundColor: '#6B1E2B' }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      ) : (
                        <span className="text-xs italic" style={{ color: '#6E6460' }}>
                          Admin only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <p className="text-sm">No items found matching filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESTOCK MODAL */}
      {isRestockModalOpen && selectedProduct && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border"
            style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
          >
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: '#6B1E2B' }}
            >
              <div>
                <h3 className="font-bold text-lg">Restock Inventory</h3>
                <p className="text-xs text-amber-200">Add stock received from supplier</p>
              </div>
              <button
                onClick={handleCloseRestock}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessRestock} className="p-6 space-y-4">
              {/* Product Info Display */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base" style={{ color: '#2B2523' }}>
                      {selectedProduct.name}
                    </h4>
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: '#FFFDF8',
                        borderColor: '#E6DCCB',
                        color: '#6B1E2B',
                      }}
                    >
                      Code: {selectedProduct.productCode}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: '#6E6460' }}>
                    {selectedProduct.category}
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 gap-3 pt-2 border-t text-xs"
                  style={{ borderColor: '#E6DCCB' }}
                >
                  <div>
                    <span style={{ color: '#6E6460' }}>Current Stock:</span>
                    <div className="text-lg font-black font-mono" style={{ color: '#2B2523' }}>
                      {selectedProduct.stockQuantity} {selectedProduct.unit}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#6E6460' }}>Projected Stock:</span>
                    <div className="text-lg font-black font-mono" style={{ color: '#6B1E2B' }}>
                      {selectedProduct.stockQuantity + (parseInt(quantityToAdd, 10) || 0)}{' '}
                      {selectedProduct.unit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {restockError && (
                <div className="p-3 rounded-xl border text-xs font-semibold bg-rose-50 border-rose-300 text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{restockError}</span>
                </div>
              )}

              {/* Quantity to Add */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: '#2B2523' }}
                >
                  Quantity to Add ({selectedProduct.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full px-4 py-3 border-2 rounded-xl font-mono text-xl font-bold outline-none"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#6B1E2B',
                    color: '#2B2523',
                  }}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  {[5, 10, 20, 50, 100].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setQuantityToAdd(quick.toString())}
                      className="px-2.5 py-1 border rounded text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: '#FFF8E7',
                        borderColor: '#E6DCCB',
                        color: '#2B2523',
                      }}
                    >
                      +{quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#2B2523' }}
                >
                  Supplier / Note (Optional)
                </label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="e.g. Received shipment"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseRestock}
                  className="flex-1 py-2.5 px-4 border rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 text-white font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  style={{
                    backgroundColor: '#6B1E2B',
                    boxShadow: '0 4px 12px rgba(107, 30, 43, 0.25)',
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Restock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border max-h-[85vh] flex flex-col"
            style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
          >
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: '#6B1E2B' }}
            >
              <div>
                <h3 className="font-bold text-lg">Stock Movement Logs</h3>
                <p className="text-xs text-amber-200">Audit trail of sales and restocks</p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {stockMovements.length > 0 ? (
                <div className="divide-y" style={{ borderColor: '#E6DCCB' }}>
                  {stockMovements.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: m.quantityChanged > 0 ? '#F7EBED' : '#FFF8E7',
                            color: m.quantityChanged > 0 ? '#6B1E2B' : '#6E6460',
                          }}
                        >
                          {m.quantityChanged > 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold" style={{ color: '#2B2523' }}>
                            {m.productName}{' '}
                            <span className="font-mono text-xs font-normal" style={{ color: '#6E6460' }}>
                              [{m.productCode}]
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: '#6E6460' }}>
                            {new Date(m.createdAt).toLocaleString()} • {m.note || m.type}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className="font-mono font-bold"
                          style={{ color: m.quantityChanged > 0 ? '#6B1E2B' : '#2B2523' }}
                        >
                          {m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged}
                        </div>
                        <div className="text-[11px] font-mono" style={{ color: '#6E6460' }}>
                          {m.previousQuantity} → {m.newQuantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400">
                  <History className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">No stock movements recorded yet.</p>
                </div>
              )}
            </div>

            <div
              className="px-6 py-3 border-t text-right"
              style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB' }}
            >
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#FFFDF8',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
