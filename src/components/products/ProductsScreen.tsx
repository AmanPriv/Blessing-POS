import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  X,
  Check,
  Package,
} from 'lucide-react';
import { Product, AppSettings, User } from '../../types';
import { storage } from '../../services/storage';
import { exportProductsToExcel } from '../../services/excelService';

interface ProductsScreenProps {
  products: Product[];
  settings: AppSettings;
  currentUser: User;
  onRefresh: () => void;
  onOpenImport: () => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  products,
  settings,
  currentUser,
  onRefresh,
  onOpenImport,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minStockThreshold: settings.defaultMinStockThreshold.toString(),
    unit: 'pcs',
    description: '',
    sku: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isResetProductsModalOpen, setIsResetProductsModalOpen] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const handleConfirmClearAllProducts = () => {
    if (!isAdmin) return;
    const res = storage.clearAllProducts(currentUser.role);
    setIsResetProductsModalOpen(false);
    if (res.success) {
      onRefresh();
      setResetNotice('All products have been removed from the catalog.');
      setTimeout(() => setResetNotice(null), 4000);
    }
  };

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingProduct(null);
    setFormData({
      productCode: '',
      name: '',
      category: categories[0] || 'General',
      costPrice: '',
      sellingPrice: '',
      stockQuantity: '0',
      minStockThreshold: settings.defaultMinStockThreshold.toString(),
      unit: 'pcs',
      description: '',
      sku: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    if (!isAdmin) return;
    setEditingProduct(p);
    setFormData({
      productCode: p.productCode,
      name: p.name,
      category: p.category,
      costPrice: p.costPrice ? p.costPrice.toString() : '',
      sellingPrice: p.sellingPrice.toString(),
      stockQuantity: p.stockQuantity.toString(),
      minStockThreshold: p.minStockThreshold.toString(),
      unit: p.unit,
      description: p.description || '',
      sku: p.sku || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (p: Product) => {
    if (!isAdmin) return;
    setProductToDelete(p);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;
    const res = storage.deleteProduct(productToDelete.id, currentUser.role);
    setProductToDelete(null);
    if (res.success) {
      onRefresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Unauthorized: Cashiers cannot modify product pricing or catalog.');
      return;
    }
    setFormError(null);

    const code = formData.productCode.trim().toUpperCase();
    const name = formData.name.trim();

    if (!code) {
      setFormError('Product code is required.');
      return;
    }
    if (!name) {
      setFormError('Product name is required.');
      return;
    }

    const sellingPrice = parseFloat(formData.sellingPrice);
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      setFormError('Selling price must be a valid non-negative number.');
      return;
    }

    const costPrice = parseFloat(formData.costPrice) || 0;
    const stockQuantity = parseInt(formData.stockQuantity, 10) || 0;
    const minStockThreshold = parseInt(formData.minStockThreshold, 10) || settings.defaultMinStockThreshold;

    const payload = {
      productCode: code,
      name,
      category: formData.category.trim() || 'General',
      sellingPrice,
      costPrice,
      stockQuantity: Math.max(0, stockQuantity),
      minStockThreshold: Math.max(0, minStockThreshold),
      unit: formData.unit.trim() || 'pcs',
      description: formData.description.trim() || undefined,
      sku: formData.sku.trim() || undefined,
    };

    const res = storage.saveProduct(payload, editingProduct?.id, currentUser.role);
    if (!res.success) {
      setFormError(res.message || 'Error saving product.');
      return;
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: '#6B1E2B' }}
          >
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6E6460' }}>
            {isAdmin
              ? 'Manage shop items, unique product codes, and retail pricing.'
              : 'Search products, check prices, and look up product codes.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            <span>Export Excel</span>
          </button>

          {isAdmin && (
            <>
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsResetProductsModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 border rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer"
                  style={{
                    backgroundColor: '#FDF2F3',
                    borderColor: '#F5C6CB',
                    color: '#6B1E2B',
                  }}
                  title="Remove all products from catalog"
                >
                  <Trash2 className="w-4 h-4 text-[#6B1E2B]" />
                  <span>Reset / Clear Catalog</span>
                </button>
              )}
              <button
                onClick={onOpenImport}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 border rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#6B1E2B',
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="flex items-center space-x-1.5 px-4 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: '#6B1E2B',
                  boxShadow: '0 4px 12px rgba(107, 30, 43, 0.25)',
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {resetNotice && (
        <div
          className="p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border animate-in fade-in duration-150"
          style={{
            backgroundColor: '#F7EBED',
            borderColor: '#E6DCCB',
            color: '#6B1E2B',
          }}
        >
          <Check className="w-4 h-4 text-[#6B1E2B]" />
          <span>{resetNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
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
            placeholder="Search by code (e.g. CC001), name, or SKU..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl outline-none"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#6E6460' }}>
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-xs sm:text-sm outline-none"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {(searchQuery || categoryFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
              }}
              className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer hover:bg-neutral-100 whitespace-nowrap"
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

      {/* Products Table */}
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
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                {isAdmin && <th className="py-3 px-4 text-right">Cost Price</th>}
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
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
                    <td className="py-3 px-4">
                      <div className="font-bold" style={{ color: '#2B2523' }}>
                        {p.name}
                      </div>
                      {p.description && (
                        <div className="text-xs opacity-75 line-clamp-1" style={{ color: '#6E6460' }}>
                          {p.description}
                        </div>
                      )}
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
                    {isAdmin && (
                      <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6E6460' }}>
                        {p.costPrice ? `${settings.currency} ${p.costPrice.toFixed(2)}` : '—'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold" style={{ color: '#2B2523' }}>
                        {p.stockQuantity}
                      </span>{' '}
                      <span className="text-xs" style={{ color: '#6E6460' }}>{p.unit}</span>
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
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            style={{ color: '#6E6460' }}
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                            style={{ color: '#6E6460' }}
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="py-12 text-center text-neutral-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                    <p className="text-sm">No products found matching query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col"
            style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
          >
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: '#6B1E2B' }}
            >
              <div>
                <h3 className="font-bold text-lg">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-amber-200">
                  {editingProduct
                    ? `Updating ${editingProduct.productCode}`
                    : 'Assign a unique product code and price'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div
                  className="p-3 rounded-xl border text-xs flex items-center space-x-2"
                  style={{
                    backgroundColor: '#FDF2F3',
                    borderColor: '#F5C6CB',
                    color: '#6B1E2B',
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    Product Code * (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productCode}
                    onChange={(e) =>
                      setFormData({ ...formData, productCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. CC001"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono uppercase font-bold outline-none"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                  <p className="text-[11px] mt-1" style={{ color: '#6E6460' }}>
                    Type this code in POS to sell instantly.
                  </p>
                </div>

                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Secondary SKU"
                    className="w-full px-3.5 py-2.5 border rounded-xl outline-none"
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
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#2B2523' }}
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Coca Cola 500ml"
                  className="w-full px-3.5 py-2.5 border rounded-xl font-medium outline-none"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Category name"
                    className="w-full px-3.5 py-2.5 border rounded-xl outline-none"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                  <datalist id="category-suggestions">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, kg, bottle, pack"
                    className="w-full px-3.5 py-2.5 border rounded-xl outline-none"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    Selling Price * ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="50.00"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono font-bold outline-none"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#6B1E2B',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    Cost Price ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="38.00"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono outline-none"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono outline-none"
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderColor: '#E6DCCB',
                      color: '#2B2523',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#2B2523' }}
                  >
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockThreshold: e.target.value })
                    }
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono outline-none"
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
                  className="block text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#2B2523' }}
                >
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional notes or details"
                  className="w-full px-3.5 py-2 border rounded-xl text-sm outline-none resize-none"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                />
              </div>

              <div className="pt-3 border-t flex gap-3" style={{ borderColor: '#E6DCCB' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  className="flex-1 py-2.5 px-4 text-white font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  style={{
                    backgroundColor: '#6B1E2B',
                    boxShadow: '0 4px 12px rgba(107, 30, 43, 0.25)',
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-2xl border shadow-xl p-6 space-y-4"
            style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FDF2F3', color: '#6B1E2B' }}
              >
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: '#6B1E2B' }}>
                  Delete Product?
                </h3>
                <p className="text-xs text-neutral-500">
                  {productToDelete.name} ({productToDelete.productCode})
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB', color: '#2B2523' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow active:scale-95"
                style={{ backgroundColor: '#6B1E2B' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset / Clear All Products Confirmation Modal */}
      {isResetProductsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 space-y-4 border shadow-2xl animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#FDF2F3', color: '#6B1E2B' }}
              >
                <Trash2 className="w-5 h-5 text-[#6B1E2B]" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: '#2B2523' }}>
                  Reset &amp; Clear All Products?
                </h3>
                <p className="text-xs" style={{ color: '#6E6460' }}>
                  This will permanently delete all {products.length} products from the store catalog.
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: '#2B2523' }}>
              Are you sure you want to remove all products? You will have an empty catalog to add your own products from scratch or import from Excel.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetProductsModalOpen(false)}
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
                onClick={handleConfirmClearAllProducts}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow active:scale-95"
                style={{ backgroundColor: '#6B1E2B' }}
              >
                Yes, Remove All Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
