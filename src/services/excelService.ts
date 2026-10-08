import * as XLSX from 'xlsx';
import { Product, Sale } from '../types';

export interface ColumnMapping {
  name: string;
  productCode: string;
  category: string;
  sellingPrice: string;
  costPrice: string;
  stockQuantity: string;
  minStockThreshold: string;
  unit: string;
  sku: string;
  description: string;
}

export interface ParsedSheetData {
  sheetName: string;
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: ColumnMapping;
}

// Intelligent column header detection
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  const findMatch = (candidates: string[]): string => {
    for (const cand of candidates) {
      const match = headers.find((h) => normalize(h) === normalize(cand));
      if (match) return match;
    }
    // Partial substring match
    for (const cand of candidates) {
      const match = headers.find((h) => normalize(h).includes(normalize(cand)));
      if (match) return match;
    }
    return '';
  };

  return {
    name: findMatch(['product name', 'item name', 'product', 'item', 'name', 'title', 'goods']),
    productCode: findMatch(['code', 'product code', 'item code', 'productcode', 'itemcode', 'code no', 'art no', 'article', 'id']),
    category: findMatch(['category', 'category name', 'cat', 'group', 'department', 'type', 'section']),
    sellingPrice: findMatch(['selling price', 'price', 'unit price', 'retail price', 'sale price', 'rate']),
    costPrice: findMatch(['cost price', 'cost', 'buying price', 'purchase price', 'wholesale price', 'buy price']),
    stockQuantity: findMatch(['stock quantity', 'stock', 'quantity', 'qty', 'balance', 'inventory', 'on hand']),
    minStockThreshold: findMatch(['min stock threshold', 'min stock', 'minimum stock', 'threshold', 'reorder level', 'reorder point', 'min qty']),
    unit: findMatch(['unit', 'uom', 'measure', 'package unit']),
    sku: findMatch(['sku', 'sku code', 'part number']),
    description: findMatch(['description', 'desc', 'notes', 'details']),
  };
}

// Parse file (XLSX, XLS, or CSV)
export async function parseExcelFile(file: File): Promise<ParsedSheetData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

  if (jsonData.length === 0) {
    throw new Error('Spreadsheet appears to be empty.');
  }

  // Find header row (the first row with at least 2 non-empty string values)
  let headerRowIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
    const row = jsonData[i] as any[];
    if (Array.isArray(row)) {
      const stringCells = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== '');
      if (stringCells.length >= 2) {
        headerRowIndex = i;
        headers = row.map((c, idx) => (c ? String(c).trim() : `Column_${idx + 1}`));
        break;
      }
    }
  }

  if (headers.length === 0) {
    throw new Error('Could not identify header row in the spreadsheet.');
  }

  // Convert remaining rows into object records
  const rawRows: Record<string, any>[] = [];
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (!row || !Array.isArray(row) || row.every((c) => c === undefined || c === null || c === '')) {
      continue; // skip blank rows
    }
    const record: Record<string, any> = {};
    headers.forEach((hdr, idx) => {
      record[hdr] = row[idx];
    });
    rawRows.push(record);
  }

  const detectedMapping = detectColumnMapping(headers);

  return {
    sheetName: firstSheetName,
    headers,
    rawRows,
    detectedMapping,
  };
}

// Map parsed rows to Product objects
export function convertRowsToProducts(
  rawRows: Record<string, any>[],
  mapping: ColumnMapping,
  defaultThreshold = 5
): Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] {
  const products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const row of rawRows) {
    const codeRaw = mapping.productCode ? row[mapping.productCode] : '';
    const nameRaw = mapping.name ? row[mapping.name] : '';

    if (!codeRaw && !nameRaw) continue; // skip empty

    const productCode = String(codeRaw || '').trim().toUpperCase();
    const name = String(nameRaw || '').trim() || `Product ${productCode}`;

    if (!productCode) continue;

    const sellingPrice = mapping.sellingPrice ? Math.max(0, parseFloat(String(row[mapping.sellingPrice]).replace(/[^0-9.-]/g, '')) || 0) : 0;
    const costPrice = mapping.costPrice ? Math.max(0, parseFloat(String(row[mapping.costPrice]).replace(/[^0-9.-]/g, '')) || 0) : 0;
    const stockQuantity = mapping.stockQuantity ? Math.max(0, parseInt(String(row[mapping.stockQuantity]).replace(/[^0-9-]/g, ''), 10) || 0) : 0;
    const minStockThreshold = mapping.minStockThreshold
      ? Math.max(0, parseInt(String(row[mapping.minStockThreshold]).replace(/[^0-9-]/g, ''), 10) || defaultThreshold)
      : defaultThreshold;

    const category = mapping.category && row[mapping.category] ? String(row[mapping.category]).trim() : 'General';
    const unit = mapping.unit && row[mapping.unit] ? String(row[mapping.unit]).trim() : 'pcs';
    const sku = mapping.sku && row[mapping.sku] ? String(row[mapping.sku]).trim() : undefined;
    const description = mapping.description && row[mapping.description] ? String(row[mapping.description]).trim() : undefined;

    products.push({
      productCode,
      name,
      category,
      sellingPrice,
      costPrice,
      stockQuantity,
      minStockThreshold,
      unit,
      sku,
      description,
    });
  }

  return products;
}

// Download Sample Template XLSX
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Product Code': 'CC001',
      'Product Name': 'Coca Cola 500ml',
      'Category': 'Beverages',
      'Selling Price': 50,
      'Cost Price': 38,
      'Stock Quantity': 20,
      'Min Stock Threshold': 5,
      'Unit': 'pcs',
      'Description': 'Chilled carbonated soft drink',
    },
    {
      'Product Code': 'SN002',
      'Product Name': 'Snickers Chocolate Bar 50g',
      'Category': 'Snacks & Confectionery',
      'Selling Price': 90,
      'Cost Price': 70,
      'Stock Quantity': 15,
      'Min Stock Threshold': 5,
      'Unit': 'pcs',
      'Description': 'Chocolate bar with peanuts and caramel',
    },
    {
      'Product Code': 'AMB01',
      'Product Name': 'Ambo Mineral Water 500ml',
      'Category': 'Beverages',
      'Selling Price': 35,
      'Cost Price': 22,
      'Stock Quantity': 30,
      'Min Stock Threshold': 8,
      'Unit': 'pcs',
      'Description': 'Natural sparkling mineral water',
    },
    {
      'Product Code': 'SUG01',
      'Product Name': 'White Sugar 1kg',
      'Category': 'Groceries & Staples',
      'Selling Price': 135,
      'Cost Price': 110,
      'Stock Quantity': 25,
      'Min Stock Threshold': 10,
      'Unit': 'kg',
      'Description': 'Refined sugar pack',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  XLSX.writeFile(workbook, 'pos_product_catalog_template.xlsx');
}

// Export Products to Excel
export function exportProductsToExcel(products: Product[]): void {
  const exportData = products.map((p) => ({
    'Product Code': p.productCode,
    'Product Name': p.name,
    'Category': p.category,
    'Selling Price': p.sellingPrice,
    'Cost Price': p.costPrice || 0,
    'Stock Quantity': p.stockQuantity,
    'Min Stock Threshold': p.minStockThreshold,
    'Unit': p.unit,
    'SKU': p.sku || '',
    'Description': p.description || '',
    'Status': p.stockQuantity === 0 ? 'OUT OF STOCK' : p.stockQuantity <= p.minStockThreshold ? 'LOW STOCK' : 'IN STOCK',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Catalog');
  XLSX.writeFile(workbook, `pos_products_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Export Sales to Excel
export function exportSalesToExcel(sales: Sale[]): void {
  const exportData = sales.map((s) => ({
    'Transaction ID': s.receiptNumber,
    'Date & Time': new Date(s.createdAt).toLocaleString(),
    'Items Count': s.items.reduce((acc, i) => acc + i.quantity, 0),
    'Subtotal': s.subtotal,
    'Discount': s.discount,
    'Grand Total': s.grandTotal,
    'Payment Method': s.paymentMethod.replace('_', ' ').toUpperCase(),
    'Amount Received': s.amountReceived,
    'Change': s.change,
    'Cashier': s.cashierName,
    'Items Summary': s.items.map((i) => `${i.productName} (${i.productCode}) x${i.quantity}`).join('; '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales History');
  XLSX.writeFile(workbook, `pos_sales_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
