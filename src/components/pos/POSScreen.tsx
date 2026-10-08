import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building,
  CreditCard,
  X,
  Keyboard,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, AppSettings, User, Sale } from '../../types';
import { storage } from '../../services/storage';
import { sounds } from '../../utils/audio';
import { EthiopianDate, getCurrentEthiopianDate, ethToDate, formatEthiopianDate } from '../../utils/ethiopianCalendar';
import { EthiopianDateInput } from '../common/EthiopianDateInput';

interface POSScreenProps {
  settings: AppSettings;
  currentUser: User;
  onRefreshData?: () => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  settings,
  currentUser,
  onRefreshData,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Ethiopian Calendar & Back-log state for recording sales
  const [ethSaleDate, setEthSaleDate] = useState<EthiopianDate>(getCurrentEthiopianDate());
  const [saleTime, setSaleTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [isBacklogSale, setIsBacklogSale] = useState<boolean>(false);

  // Sale completed notification modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // References
  const codeInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Load products & categories from storage
  const loadData = () => {
    const prods = storage.getProducts();
    setProducts(prods);
    const cats = Array.from(new Set(prods.map((p) => p.category).filter(Boolean)));
    setCategories(cats);
  };

  useEffect(() => {
    loadData();
    // Auto-focus code input on mount
    focusCodeInput();
  }, []);

  const focusCodeInput = () => {
    setTimeout(() => {
      if (codeInputRef.current) {
        codeInputRef.current.focus();
        codeInputRef.current.select();
      }
    }, 50);
  };

  // Show temporary banner notification
  const showNotice = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setNotice({ text, type });
    if (type === 'error') {
      sounds.playErrorBoop();
    }
    setTimeout(() => {
      setNotice((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  // Core requirement: Instant product addition via Product Code + Enter
  const handleCodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = codeInputValue.trim();
    if (!query) return;

    // Refresh products in memory to ensure latest stock
    const freshProducts = storage.getProducts();
    setProducts(freshProducts);

    // Find product by code (case-insensitive) or SKU
    const matched = freshProducts.find(
      (p) =>
        p.productCode.trim().toLowerCase() === query.toLowerCase() ||
        (p.sku && p.sku.trim().toLowerCase() === query.toLowerCase())
    );

    if (!matched) {
      showNotice(`Product code "${query}" not found.`, 'error');
      // Keep input for easy correction
      if (codeInputRef.current) {
        codeInputRef.current.select();
      }
      return;
    }

    // Check stock
    if (matched.stockQuantity <= 0) {
      showNotice(`"${matched.name}" is OUT OF STOCK. Cannot add to sale.`, 'error');
      setCodeInputValue('');
      focusCodeInput();
      return;
    }

    // Check if already in cart
    const existingIndex = cart.findIndex((item) => item.product.id === matched.id);

    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > matched.stockQuantity) {
        showNotice(
          `Only ${matched.stockQuantity} unit(s) of "${matched.name}" available in stock.`,
          'error'
        );
        setCodeInputValue('');
        focusCodeInput();
        return;
      }

      // Increment quantity
      const updatedCart = [...cart];
      const newQty = currentQty + 1;
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty,
        subtotal: newQty * matched.sellingPrice,
      };
      setCart(updatedCart);
      sounds.playSuccessBeep();
      showNotice(`Added another "${matched.name}" (Qty: ${newQty})`, 'success');
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        product: matched,
        quantity: 1,
        unitPrice: matched.sellingPrice,
        subtotal: matched.sellingPrice,
      };
      setCart([...cart, newItem]);
      sounds.playSuccessBeep();
      showNotice(`Added "${matched.name}" (${matched.productCode}) to cart`, 'success');
    }

    // Clear input & return cursor back immediately
    setCodeInputValue('');
    focusCodeInput();
  };

  // Add from search / catalog click
  const handleAddProductFromCatalog = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showNotice(`"${product.name}" is OUT OF STOCK.`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.stockQuantity) {
        showNotice(`Only ${product.stockQuantity} unit(s) available in stock.`, 'error');
        return;
      }
      const updatedCart = [...cart];
      const newQty = currentQty + 1;
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty,
        subtotal: newQty * product.sellingPrice,
      };
      setCart(updatedCart);
      sounds.playSuccessBeep();
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: product.sellingPrice,
          subtotal: product.sellingPrice,
        },
      ]);
      sounds.playSuccessBeep();
    }
    focusCodeInput();
  };

  // Cart operations
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    const availableStock = item.product.stockQuantity;

    if (newQty > availableStock) {
      showNotice(`Only ${availableStock} unit(s) available for "${item.product.name}".`, 'error');
      newQty = availableStock;
    }

    const updated = [...cart];
    updated[index] = {
      ...item,
      quantity: newQty,
      subtotal: newQty * item.unitPrice,
    };
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
    focusCodeInput();
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setDiscountAmount(0);
    showNotice('Cart has been reset.', 'info');
    focusCodeInput();
  };

  // Calculations
  const rawSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const calculatedDiscount =
    discountType === 'percent'
      ? Math.min(rawSubtotal, (rawSubtotal * (discountAmount || 0)) / 100)
      : Math.min(rawSubtotal, discountAmount || 0);

  const grandTotal = Math.max(0, rawSubtotal - calculatedDiscount);

  // Open checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showNotice('Cart is empty. Add products first.', 'error');
      focusCodeInput();
      return;
    }
    setPaymentMethod('cash');
    setAmountReceived(grandTotal.toString());
    setIsCheckoutOpen(true);
    setTimeout(() => {
      if (amountInputRef.current) {
        amountInputRef.current.focus();
        amountInputRef.current.select();
      }
    }, 100);
  };

  // Quick cash buttons helper
  const parsedReceived = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, parsedReceived - grandTotal);
  const isCashSufficient = paymentMethod !== 'cash' || parsedReceived >= grandTotal;

  const handleQuickCash = (amt: number) => {
    setAmountReceived(amt.toString());
  };

  const handleAddCash = (increment: number) => {
    const current = parseFloat(amountReceived) || 0;
    setAmountReceived((current + increment).toString());
  };

  // Process checkout
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && parsedReceived < grandTotal) {
      showNotice(`Amount received must be at least ${settings.currency} ${grandTotal.toFixed(2)}`, 'error');
      return;
    }

    const saleItems = cart.map((item) => ({
      productId: item.product.id,
      productCode: item.product.productCode,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.product.costPrice || 0,
      subtotal: item.subtotal,
    }));

    // Resolve date of sale: if backlog is enabled, compute from chosen Ethiopian date + time
    let saleTimestamp: string;
    let formattedEthDate: string;

    if (isBacklogSale) {
      const [hh, mm] = (saleTime || '12:00').split(':').map((v) => parseInt(v, 10) || 0);
      const computedDate = ethToDate(ethSaleDate.year, ethSaleDate.month, ethSaleDate.day, hh, mm, 0);
      saleTimestamp = computedDate.toISOString();
      formattedEthDate = formatEthiopianDate(computedDate, { includeTime: true });
    } else {
      const now = new Date();
      saleTimestamp = now.toISOString();
      formattedEthDate = formatEthiopianDate(now, { includeTime: true });
    }

    const result = storage.completeSale({
      items: saleItems,
      subtotal: rawSubtotal,
      discount: calculatedDiscount,
      grandTotal,
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? parsedReceived : grandTotal,
      change: paymentMethod === 'cash' ? changeDue : 0,
      paymentNote: paymentNote.trim() || undefined,
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      createdAt: saleTimestamp,
      ethiopianDate: formattedEthDate,
      isBacklog: isBacklogSale,
    });

    if (!result.success || !result.sale) {
      showNotice(result.message || 'Checkout failed.', 'error');
      return;
    }

    sounds.playCheckoutChime();

    // Close checkout, show sale completed success notification
    setIsCheckoutOpen(false);
    setCompletedSale(result.sale);

    // Refresh products
    loadData();
    if (onRefreshData) onRefreshData();

    // Reset cart
    setCart([]);
    setDiscountAmount(0);
    setPaymentNote('');
  };

  const handleCloseCompletedModal = () => {
    setCompletedSale(null);
    focusCodeInput();
  };

  // Allow Enter/Escape to dismiss success notification and immediately start next sale
  useEffect(() => {
    if (!completedSale) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleCloseCompletedModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completedSale]);

  // Filter catalog list
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div
      className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] overflow-hidden"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* LEFT COLUMN: Fast Code Input & Product Catalog */}
      <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto">
        {/* Banner Notification */}
        {notice && (
          <div
            className="mb-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 border"
            style={{
              backgroundColor: notice.type === 'error' ? '#FDF2F3' : '#F7EBED',
              borderColor: notice.type === 'error' ? '#F5C6CB' : '#E6DCCB',
              color: notice.type === 'error' ? '#6B1E2B' : '#2B2523',
            }}
          >
            <div className="flex items-center space-x-2">
              {notice.type === 'error' && (
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#6B1E2B' }} />
              )}
              {notice.type === 'success' && (
                <Check className="w-4 h-4 shrink-0" style={{ color: '#6B1E2B' }} />
              )}
              {notice.type === 'info' && (
                <Info className="w-4 h-4 shrink-0" style={{ color: '#6E6460' }} />
              )}
              <span>{notice.text}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. PROMINENT PRODUCT CODE INPUT (Speed-selling control) */}
        <div
          className="rounded-2xl p-4 sm:p-5 shadow-sm border mb-4"
          style={{
            backgroundColor: '#FFFDF8',
            borderColor: '#E6DCCB',
          }}
        >
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5" style={{ color: '#6B1E2B' }}>
              <Keyboard className="w-4 h-4" />
              <span>Enter Product Code (Fast Scan / Typing)</span>
            </span>
            <span className="text-[11px] font-normal" style={{ color: '#6E6460' }}>
              Press <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB' }}>ENTER</kbd> to add
            </span>
          </label>
          <form onSubmit={handleCodeSubmit} className="relative flex gap-2">
            <input
              ref={codeInputRef}
              type="text"
              value={codeInputValue}
              onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
              placeholder="e.g. CC001, SN002, AMB01..."
              className="flex-1 text-lg sm:text-2xl font-mono font-bold tracking-wide px-4 py-3 sm:py-3.5 border-2 rounded-xl transition-all outline-none uppercase placeholder:font-sans placeholder:text-neutral-400 placeholder:text-base placeholder:font-normal"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#6B1E2B',
                color: '#2B2523',
              }}
              autoComplete="off"
              autoFocus
            />
            <button
              type="submit"
              className="px-5 sm:px-8 py-3 text-white font-bold text-base rounded-xl shadow-md active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
              style={{
                backgroundColor: '#6B1E2B',
                boxShadow: '0 4px 14px rgba(107, 30, 43, 0.3)',
              }}
            >
              <span>Add</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold" style={{ color: '#6E6460' }}>Quick code suggestions:</span>
            {products.slice(0, 5).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setCodeInputValue(p.productCode);
                  if (codeInputRef.current) codeInputRef.current.focus();
                }}
                className="px-2 py-0.5 border rounded font-mono text-[11px] transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              >
                {p.productCode} ({p.name.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

        {/* 2. SEARCH & BROWSE CATALOG */}
        <div
          className="rounded-2xl p-4 shadow-sm border flex-1 flex flex-col min-h-0"
          style={{
            backgroundColor: '#FFFDF8',
            borderColor: '#E6DCCB',
          }}
        >
          <div
            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b"
            style={{ borderColor: '#E6DCCB' }}
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by name or code..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl outline-none transition-all"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  backgroundColor: selectedCategory === 'ALL' ? '#6B1E2B' : '#FFF8E7',
                  color: selectedCategory === 'ALL' ? '#FFFFFF' : '#2B2523',
                  border: '1px solid #E6DCCB',
                }}
              >
                All Items ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                  style={{
                    backgroundColor: selectedCategory === cat ? '#6B1E2B' : '#FFF8E7',
                    color: selectedCategory === cat ? '#FFFFFF' : '#2B2523',
                    border: '1px solid #E6DCCB',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="flex-1 overflow-y-auto pt-3 pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredProducts.map((p) => {
              const isOut = p.stockQuantity === 0;
              const isLow = p.stockQuantity <= p.minStockThreshold && !isOut;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && handleAddProductFromCatalog(p)}
                  className={`group relative text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isOut
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:shadow-sm cursor-pointer'
                  }`}
                  style={{
                    backgroundColor: isOut ? '#FAF6EF' : '#FFF8E7',
                    borderColor: '#E6DCCB',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: '#FFFDF8',
                          borderColor: '#E6DCCB',
                          color: '#6B1E2B',
                        }}
                      >
                        {p.productCode}
                      </span>
                      {isOut ? (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: '#FDF2F3', color: '#6B1E2B' }}
                        >
                          OUT
                        </span>
                      ) : isLow ? (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                        >
                          Low: {p.stockQuantity}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium" style={{ color: '#6E6460' }}>
                          Stock: {p.stockQuantity}
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-bold text-sm line-clamp-2 leading-snug group-hover:underline"
                      style={{ color: '#2B2523' }}
                    >
                      {p.name}
                    </h3>
                  </div>

                  <div
                    className="mt-2.5 pt-2 border-t flex items-center justify-between"
                    style={{ borderColor: '#E6DCCB' }}
                  >
                    <div>
                      <span className="text-xs mr-0.5" style={{ color: '#6E6460' }}>
                        {settings.currency}
                      </span>
                      <span
                        className="font-black text-base"
                        style={{ color: '#6B1E2B' }}
                      >
                        {p.sellingPrice.toFixed(2)}
                      </span>
                    </div>
                    {!isOut && (
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors group-hover:bg-[#6B1E2B] group-hover:text-white"
                        style={{ backgroundColor: '#FFFDF8', color: '#2B2523' }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-400">
                <Search className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p className="text-sm">No products found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sales Cart & Checkout */}
      <div
        className="w-full lg:w-96 xl:w-[420px] border-t lg:border-t-0 lg:border-l flex flex-col h-auto lg:h-full shadow-lg lg:shadow-none"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        {/* Cart Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: '#E6DCCB',
            backgroundColor: '#FFF8E7',
          }}
        >
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" style={{ color: '#6B1E2B' }} />
            <h2 className="font-bold text-base" style={{ color: '#2B2523' }}>
              Current Sale Cart
            </h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: '#6B1E2B' }}
            >
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              title="Reset / Clear Cart"
              className="text-xs hover:text-red-700 flex items-center space-x-1 transition-colors cursor-pointer"
              style={{ color: '#6E6460' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Cart</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[380px] lg:max-h-none">
          {cart.map((item, index) => (
            <div
              key={item.product.id}
              className="p-3 rounded-xl border transition-all flex flex-col space-y-2"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="font-mono text-xs font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: '#FFFDF8',
                        borderColor: '#E6DCCB',
                        color: '#6B1E2B',
                      }}
                    >
                      {item.product.productCode}
                    </span>
                    <h4
                      className="font-bold text-sm leading-tight"
                      style={{ color: '#2B2523' }}
                    >
                      {item.product.name}
                    </h4>
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#6E6460' }}>
                    {settings.currency} {item.unitPrice.toFixed(2)} / {item.product.unit}
                    <span className="ml-2 text-[11px] opacity-75">
                      (Stock: {item.product.stockQuantity})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-black font-mono text-sm"
                    style={{ color: '#6B1E2B' }}
                  >
                    {settings.currency} {item.subtotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between pt-1">
                <div
                  className="flex items-center space-x-1 border rounded-lg p-0.5"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E6DCCB',
                  }}
                >
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className="p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                    style={{ color: '#2B2523' }}
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.product.stockQuantity}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, parseInt(e.target.value, 10) || 1)}
                    className="w-12 text-center text-xs font-bold outline-none"
                    style={{ color: '#2B2523' }}
                  />
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                    style={{ color: '#2B2523' }}
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(index)}
                  className="text-neutral-400 hover:text-red-700 p-1 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400">
              <ShoppingCart className="w-12 h-12 stroke-[1.5] text-neutral-300 mb-3" />
              <p className="font-bold text-sm" style={{ color: '#2B2523' }}>
                Cart is empty
              </p>
              <p className="text-xs mt-1 max-w-[220px]" style={{ color: '#6E6460' }}>
                Enter a product code above and hit Enter, or select items from catalog.
              </p>
            </div>
          )}
        </div>

        {/* Cart Totals & Discount */}
        <div
          className="p-4 border-t space-y-2.5"
          style={{
            backgroundColor: '#FFF8E7',
            borderColor: '#E6DCCB',
          }}
        >
          {/* Subtotal */}
          <div className="flex justify-between text-xs sm:text-sm" style={{ color: '#6E6460' }}>
            <span>Subtotal:</span>
            <span className="font-semibold" style={{ color: '#2B2523' }}>
              {settings.currency} {rawSubtotal.toFixed(2)}
            </span>
          </div>

          {/* Discount Field */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#6E6460' }}>Discount:</span>
            <div className="flex items-center space-x-1.5">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}
                className="border rounded px-1.5 py-0.5 text-xs outline-none"
                style={{
                  backgroundColor: '#FFFDF8',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              >
                <option value="fixed">{settings.currency}</option>
                <option value="percent">%</option>
              </select>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-16 border rounded px-1.5 py-0.5 text-right font-medium outline-none"
                style={{
                  backgroundColor: '#FFFDF8',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              />
              {calculatedDiscount > 0 && (
                <span className="font-medium" style={{ color: '#6B1E2B' }}>
                  -{settings.currency} {calculatedDiscount.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Grand Total */}
          <div
            className="pt-2 border-t flex justify-between items-baseline"
            style={{ borderColor: '#E6DCCB' }}
          >
            <span className="text-sm font-bold" style={{ color: '#2B2523' }}>
              Grand Total:
            </span>
            <span
              className="text-xl sm:text-2xl font-black font-mono"
              style={{ color: '#6B1E2B' }}
            >
              {settings.currency} {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Pay / Checkout Button */}
          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer text-white"
            style={{
              backgroundColor: cart.length === 0 ? '#C4BCB5' : '#6B1E2B',
              boxShadow: cart.length === 0 ? 'none' : '0 4px 15px rgba(107, 30, 43, 0.35)',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
            }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: '#6B1E2B' }}
            >
              <div>
                <h3 className="font-bold text-lg">Complete Checkout</h3>
                <p className="text-xs text-amber-200">Select payment method & enter amount</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Grand Total Banner */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                }}
              >
                <div>
                  <span
                    className="text-xs uppercase font-bold tracking-wider"
                    style={{ color: '#6E6460' }}
                  >
                    Total Amount Due
                  </span>
                  <div
                    className="text-2xl sm:text-3xl font-black font-mono"
                    style={{ color: '#6B1E2B' }}
                  >
                    {settings.currency} {grandTotal.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-xs" style={{ color: '#6E6460' }}>
                  <div>{cart.length} unique item(s)</div>
                  <div>{cart.reduce((a, b) => a + b.quantity, 0)} total units</div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: '#2B2523' }}
                >
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setAmountReceived(grandTotal.toString());
                    }}
                    className="py-3 px-3 rounded-xl border font-medium text-xs sm:text-sm flex flex-col items-center space-y-1.5 transition-all cursor-pointer"
                    style={{
                      backgroundColor: paymentMethod === 'cash' ? '#6B1E2B' : '#FFF8E7',
                      color: paymentMethod === 'cash' ? '#FFFFFF' : '#2B2523',
                      borderColor: '#E6DCCB',
                    }}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('bank_transfer');
                      setAmountReceived(grandTotal.toString());
                    }}
                    className="py-3 px-3 rounded-xl border font-medium text-xs sm:text-sm flex flex-col items-center space-y-1.5 transition-all cursor-pointer"
                    style={{
                      backgroundColor: paymentMethod === 'bank_transfer' ? '#6B1E2B' : '#FFF8E7',
                      color: paymentMethod === 'bank_transfer' ? '#FFFFFF' : '#2B2523',
                      borderColor: '#E6DCCB',
                    }}
                  >
                    <Building className="w-5 h-5" />
                    <span>Telebirr / Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('other');
                      setAmountReceived(grandTotal.toString());
                    }}
                    className="py-3 px-3 rounded-xl border font-medium text-xs sm:text-sm flex flex-col items-center space-y-1.5 transition-all cursor-pointer"
                    style={{
                      backgroundColor: paymentMethod === 'other' ? '#6B1E2B' : '#FFF8E7',
                      color: paymentMethod === 'other' ? '#FFFFFF' : '#2B2523',
                      borderColor: '#E6DCCB',
                    }}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Other</span>
                  </button>
                </div>
              </div>

              {/* Cash Calculation Controls */}
              {paymentMethod === 'cash' && (
                <div
                  className="space-y-3 p-4 rounded-xl border"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                  }}
                >
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1"
                      style={{ color: '#2B2523' }}
                    >
                      Amount Received ({settings.currency}):
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold"
                        style={{ color: '#6E6460' }}
                      >
                        {settings.currency}
                      </span>
                      <input
                        ref={amountInputRef}
                        type="number"
                        step="any"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-14 pr-4 py-2.5 border rounded-xl font-mono text-xl font-bold outline-none"
                        style={{
                          backgroundColor: '#FFFDF8',
                          borderColor: '#E6DCCB',
                          color: '#2B2523',
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(grandTotal)}
                      className="px-2.5 py-1 border rounded text-xs font-medium cursor-pointer"
                      style={{
                        backgroundColor: '#FFFDF8',
                        borderColor: '#E6DCCB',
                        color: '#2B2523',
                      }}
                    >
                      Exact ({grandTotal.toFixed(0)})
                    </button>
                    {[50, 100, 200, 500, 1000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleAddCash(inc)}
                        className="px-2.5 py-1 border rounded text-xs font-medium cursor-pointer"
                        style={{
                          backgroundColor: '#FFFDF8',
                          borderColor: '#E6DCCB',
                          color: '#2B2523',
                        }}
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>

                  {/* Change Due Display */}
                  <div
                    className="pt-2 border-t flex justify-between items-center"
                    style={{ borderColor: '#E6DCCB' }}
                  >
                    <span className="text-sm font-semibold" style={{ color: '#2B2523' }}>
                      Change Due:
                    </span>
                    <span
                      className="text-xl font-black font-mono"
                      style={{ color: changeDue > 0 ? '#6B1E2B' : '#2B2523' }}
                    >
                      {settings.currency} {changeDue.toFixed(2)}
                    </span>
                  </div>

                  {!isCashSufficient && (
                    <div
                      className="text-xs font-semibold flex items-center space-x-1"
                      style={{ color: '#6B1E2B' }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        Amount received is short by {settings.currency}{' '}
                        {(grandTotal - parsedReceived).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Ethiopian Calendar Date & Backlog Selector */}
              <div>
                <EthiopianDateInput
                  ethDate={ethSaleDate}
                  timeStr={saleTime}
                  isBacklog={isBacklogSale}
                  onEthDateChange={(newEth) => setEthSaleDate(newEth)}
                  onTimeChange={(newTime) => setSaleTime(newTime)}
                  onToggleBacklog={(enabled) => setIsBacklogSale(enabled)}
                />
              </div>

              {/* Optional Reference or Note */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  style={{ color: '#6E6460' }}
                >
                  Payment Reference / Note (Optional):
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Telebirr Txn #12345 or Customer Name"
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-3 px-4 border rounded-xl font-semibold transition-colors cursor-pointer"
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
                  disabled={!isCashSufficient}
                  onClick={handleFinalizeSale}
                  className="flex-1 py-3 px-4 font-bold text-white rounded-xl shadow transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  style={{
                    backgroundColor: isCashSufficient ? '#6B1E2B' : '#C4BCB5',
                    cursor: isCashSufficient ? 'pointer' : 'not-allowed',
                    boxShadow: isCashSufficient ? '0 4px 15px rgba(107, 30, 43, 0.3)' : 'none',
                  }}
                >
                  <Check className="w-5 h-5" />
                  <span>Complete Sale</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SALE COMPLETED / SUCCESS NOTIFICATION MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border p-6 sm:p-8 text-center space-y-5"
            style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB' }}
          >
            {/* Success Icon */}
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white shadow-lg"
              style={{
                backgroundColor: '#6B1E2B',
                boxShadow: '0 8px 20px rgba(107, 30, 43, 0.35)',
              }}
            >
              <CheckCircle className="w-9 h-9 text-amber-200" />
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight" style={{ color: '#6B1E2B' }}>
                Sale Completed!
              </h3>
              <p className="text-xs font-semibold mt-1" style={{ color: '#6E6460' }}>
                Transaction recorded in Sales History &amp; inventory automatically updated.
              </p>
            </div>

            {/* Transaction Summary Card */}
            <div
              className="p-4 rounded-2xl border text-left text-xs space-y-2"
              style={{ backgroundColor: '#FFF8E7', borderColor: '#E6DCCB' }}
            >
              <div className="flex justify-between items-center">
                <span style={{ color: '#6E6460' }}>Transaction ID:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono font-bold" style={{ color: '#2B2523' }}>
                    {completedSale.receiptNumber}
                  </span>
                  {completedSale.isBacklog && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      Back-log
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#6E6460' }}>Ethiopian Date:</span>
                <span className="font-bold text-amber-900">
                  {completedSale.ethiopianDate || formatEthiopianDate(completedSale.createdAt, { includeTime: true })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#6E6460' }}>Items Sold:</span>
                <span className="font-bold" style={{ color: '#2B2523' }}>
                  {completedSale.items.reduce((acc, i) => acc + i.quantity, 0)} units ({completedSale.items.length} items)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#6E6460' }}>Payment Method:</span>
                <span className="font-bold uppercase" style={{ color: '#2B2523' }}>
                  {completedSale.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div
                className="flex justify-between items-center pt-2 border-t text-sm font-black"
                style={{ borderColor: '#E6DCCB', color: '#2B2523' }}
              >
                <span>Total Amount:</span>
                <span className="font-mono" style={{ color: '#6B1E2B' }}>
                  {settings.currency} {completedSale.grandTotal.toFixed(2)}
                </span>
              </div>
              {completedSale.paymentMethod === 'cash' && completedSale.change > 0 && (
                <div
                  className="flex justify-between items-center pt-1 text-sm font-black"
                  style={{ color: '#6B1E2B' }}
                >
                  <span>Change Given:</span>
                  <span className="font-mono">
                    {settings.currency} {completedSale.change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Action button */}
            <div>
              <button
                type="button"
                autoFocus
                onClick={handleCloseCompletedModal}
                className="w-full py-3.5 px-4 font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95"
                style={{
                  backgroundColor: '#6B1E2B',
                  boxShadow: '0 4px 14px rgba(107, 30, 43, 0.3)',
                }}
              >
                <Check className="w-5 h-5" />
                <span>Next Sale (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
