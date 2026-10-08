export type UserRole = 'admin' | 'cashier';

export const SHOP_NAME = 'Blessing Shop';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string;
  description?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';

export interface SaleItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  change: number;
  paymentNote?: string;
  cashierName: string;
  cashierId: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type: 'restock' | 'sale' | 'adjustment' | 'initial_import';
  previousQuantity: number;
  quantityChanged: number; // positive for addition, negative for sale
  newQuantity: number;
  note?: string;
  referenceId?: string; // e.g. receiptNumber
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface AppSettings {
  shopName: string;
  shopAddress: string;
  phoneNumber: string;
  receiptFooter: string;
  currency: string;
  currencySymbol: string;
  defaultMinStockThreshold: number;
  taxRate?: number;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
