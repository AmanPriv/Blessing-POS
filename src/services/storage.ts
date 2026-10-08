import { Product, Sale, StockMovement, Category, AppSettings, User, SHOP_NAME } from '../types';
import { formatEthiopianDate, toEthiopianDate } from '../utils/ethiopianCalendar';

const STORAGE_KEYS = {
  PRODUCTS: 'pos_fasttrack_products',
  SALES: 'pos_fasttrack_sales',
  MOVEMENTS: 'pos_fasttrack_movements',
  CATEGORIES: 'pos_fasttrack_categories',
  SETTINGS: 'pos_fasttrack_settings',
  USERS: 'pos_fasttrack_users',
  CURRENT_SESSION: 'pos_fasttrack_auth_session',
  HAS_SEEDED: 'pos_fasttrack_has_seeded',
};

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: SHOP_NAME, // Fixed to Blessing Shop
  shopAddress: 'Bole Road, Addis Ababa',
  phoneNumber: '+251 911 234 567',
  receiptFooter: 'Thank you for shopping at Blessing Shop!',
  currency: 'ETB',
  currencySymbol: 'ETB',
  defaultMinStockThreshold: 5,
  calendarPreference: 'ethiopian',
  enableBacklogSales: true,
};

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Administrator',
    role: 'admin',
    username: 'admin',
    password: 'admin123',
  },
  {
    id: 'usr-cashier',
    name: 'Cashier',
    role: 'cashier',
    username: 'cashier',
    password: 'cashier123',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-beverages', name: 'Beverages' },
  { id: 'cat-snacks', name: 'Snacks & Confectionery' },
  { id: 'cat-groceries', name: 'Groceries & Staples' },
  { id: 'cat-dairy', name: 'Dairy & Bakery' },
  { id: 'cat-personal', name: 'Personal Care & Household' },
];

// Initial products explicitly honoring the user's example:
// Coca Cola (CC001, Price: 50, Stock: 20)
// Snickers (SN002, Price: 90, Stock: 15)
// and complementary real shop items in ETB
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-cc001',
    productCode: 'CC001',
    name: 'Coca Cola 500ml',
    category: 'Beverages',
    costPrice: 38,
    sellingPrice: 50,
    stockQuantity: 20,
    minStockThreshold: 5,
    unit: 'pcs',
    description: 'Refreshing Coca Cola bottle 500ml',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-sn002',
    productCode: 'SN002',
    name: 'Snickers Chocolate Bar 50g',
    category: 'Snacks & Confectionery',
    costPrice: 70,
    sellingPrice: 90,
    stockQuantity: 15,
    minStockThreshold: 5,
    unit: 'pcs',
    description: 'Milk chocolate with peanuts and caramel',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-fnt01',
    productCode: 'FN001',
    name: 'Fanta Orange 500ml',
    category: 'Beverages',
    costPrice: 38,
    sellingPrice: 50,
    stockQuantity: 18,
    minStockThreshold: 5,
    unit: 'pcs',
    description: 'Orange flavored carbonated drink',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-amb01',
    productCode: 'AMB01',
    name: 'Ambo Mineral Water 500ml',
    category: 'Beverages',
    costPrice: 22,
    sellingPrice: 35,
    stockQuantity: 24,
    minStockThreshold: 8,
    unit: 'pcs',
    description: 'Sparkling natural mineral water',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-buna01',
    productCode: 'BUN01',
    name: 'Ethiopian Sidama Coffee (Roasted) 500g',
    category: 'Groceries & Staples',
    costPrice: 320,
    sellingPrice: 420,
    stockQuantity: 12,
    minStockThreshold: 3,
    unit: 'pack',
    description: 'Premium Ethiopian highland roasted coffee',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-tea01',
    productCode: 'TEA01',
    name: 'Wush Wush Black Tea 25 bags',
    category: 'Beverages',
    costPrice: 75,
    sellingPrice: 110,
    stockQuantity: 14,
    minStockThreshold: 4,
    unit: 'box',
    description: 'Pure highland Ethiopian black tea',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-sug01',
    productCode: 'SUG01',
    name: 'White Sugar 1kg',
    category: 'Groceries & Staples',
    costPrice: 110,
    sellingPrice: 135,
    stockQuantity: 30,
    minStockThreshold: 10,
    unit: 'kg',
    description: 'Refined cane sugar package',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-oil01',
    productCode: 'OIL01',
    name: 'Pure Sunflower Cooking Oil 1L',
    category: 'Groceries & Staples',
    costPrice: 260,
    sellingPrice: 320,
    stockQuantity: 8,
    minStockThreshold: 5,
    unit: 'bottle',
    description: 'Healthy refined sunflower oil',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-pas01',
    productCode: 'PAS01',
    name: 'Pasta Zara Spaghetti 500g',
    category: 'Groceries & Staples',
    costPrice: 65,
    sellingPrice: 85,
    stockQuantity: 4, // Intentionally low stock (<= 5) for dashboard demo
    minStockThreshold: 5,
    unit: 'pack',
    description: 'Quality durum wheat semolina pasta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-bis01',
    productCode: 'BIS01',
    name: 'Oreo Original Cookies 133g',
    category: 'Snacks & Confectionery',
    costPrice: 65,
    sellingPrice: 95,
    stockQuantity: 0, // Intentionally out of stock for demo
    minStockThreshold: 5,
    unit: 'pack',
    description: 'Sandwich biscuits with vanilla cream',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-det01',
    productCode: 'DET01',
    name: 'Dettol Antibacterial Soap 100g',
    category: 'Personal Care & Household',
    costPrice: 60,
    sellingPrice: 85,
    stockQuantity: 16,
    minStockThreshold: 5,
    unit: 'pcs',
    description: 'Original protection antiseptic bar soap',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-mlk01',
    productCode: 'MLK01',
    name: 'Fresh Pasteurized Milk 500ml',
    category: 'Dairy & Bakery',
    costPrice: 45,
    sellingPrice: 60,
    stockQuantity: 2, // Low stock
    minStockThreshold: 6,
    unit: 'pouch',
    description: 'Full cream homogenized cow milk',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  // Initializer
  public init(): void {
    const hasSeeded = localStorage.getItem(STORAGE_KEYS.HAS_SEEDED);
    if (!hasSeeded) {
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        this.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        this.set(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
      }
      localStorage.setItem(STORAGE_KEYS.HAS_SEEDED, 'true');
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        this.set(STORAGE_KEYS.PRODUCTS, []);
      }
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        this.set(STORAGE_KEYS.CATEGORIES, []);
      }
    }
    // Always enforce Blessing Shop
    const existingSettings = this.get<AppSettings | null>(STORAGE_KEYS.SETTINGS, null);
    if (!existingSettings) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    } else if (existingSettings.shopName !== SHOP_NAME) {
      this.set(STORAGE_KEYS.SETTINGS, { ...existingSettings, shopName: SHOP_NAME });
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, DEFAULT_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      this.set(STORAGE_KEYS.SALES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      this.set(STORAGE_KEYS.MOVEMENTS, []);
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  public getProductByCode(code: string): Product | undefined {
    const trimmed = code.trim().toLowerCase();
    const products = this.getProducts();
    return products.find(
      (p) =>
        p.productCode.trim().toLowerCase() === trimmed ||
        (p.sku && p.sku.trim().toLowerCase() === trimmed)
    );
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public saveProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string,
    operatorRole?: string
  ): { success: boolean; message?: string; product?: Product } {
    if (operatorRole === 'cashier') {
      return { success: false, message: 'Unauthorized: Cashiers cannot add or edit products.' };
    }

    const products = this.getProducts();
    const normalizedCode = product.productCode.trim().toUpperCase();

    // Check code duplication
    const duplicate = products.find(
      (p) => p.productCode.toUpperCase() === normalizedCode && p.id !== id
    );

    if (duplicate) {
      return { success: false, message: `Product code "${normalizedCode}" is already in use by "${duplicate.name}".` };
    }

    const now = new Date().toISOString();

    if (id) {
      // Edit
      const index = products.findIndex((p) => p.id === id);
      if (index === -1) {
        return { success: false, message: 'Product not found.' };
      }
      const updatedProduct: Product = {
        ...products[index],
        ...product,
        productCode: normalizedCode,
        updatedAt: now,
      };
      products[index] = updatedProduct;
      this.set(STORAGE_KEYS.PRODUCTS, products);

      // Check category exists, add if new
      if (product.category) {
        this.ensureCategoryExists(product.category);
      }

      return { success: true, product: updatedProduct };
    } else {
      // Create new
      const newProduct: Product = {
        ...product,
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        productCode: normalizedCode,
        createdAt: now,
        updatedAt: now,
      };
      products.push(newProduct);
      this.set(STORAGE_KEYS.PRODUCTS, products);

      // Log movement as initial
      this.addStockMovement({
        productId: newProduct.id,
        productCode: newProduct.productCode,
        productName: newProduct.name,
        type: 'initial_import',
        previousQuantity: 0,
        quantityChanged: newProduct.stockQuantity,
        newQuantity: newProduct.stockQuantity,
        note: 'Initial product creation',
        createdAt: now,
      });

      if (product.category) {
        this.ensureCategoryExists(product.category);
      }

      return { success: true, product: newProduct };
    }
  }

  public deleteProduct(id: string, operatorRole?: string): { success: boolean; message?: string } {
    if (operatorRole === 'cashier') {
      return { success: false, message: 'Unauthorized: Cashiers cannot delete products.' };
    }

    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) {
      return { success: false, message: 'Product not found.' };
    }
    this.set(STORAGE_KEYS.PRODUCTS, filtered);
    return { success: true };
  }

  public clearAllProducts(operatorRole?: string): { success: boolean; message?: string } {
    if (operatorRole === 'cashier') {
      return { success: false, message: 'Unauthorized: Cashiers cannot delete all products.' };
    }
    this.set(STORAGE_KEYS.PRODUCTS, []);
    return { success: true };
  }

  // --- RESTOCKING ---
  public restockProduct(
    productId: string,
    quantityToAdd: number,
    note?: string,
    operatorRole?: string
  ): { success: boolean; message?: string; product?: Product } {
    if (operatorRole === 'cashier') {
      return { success: false, message: 'Unauthorized: Cashiers cannot restock inventory.' };
    }

    if (quantityToAdd <= 0) {
      return { success: false, message: 'Quantity to add must be greater than 0.' };
    }

    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) {
      return { success: false, message: 'Product not found.' };
    }

    const current = products[index];
    const prevQty = current.stockQuantity;
    const newQty = prevQty + quantityToAdd;
    const now = new Date().toISOString();

    const updated: Product = {
      ...current,
      stockQuantity: newQty,
      updatedAt: now,
    };
    products[index] = updated;
    this.set(STORAGE_KEYS.PRODUCTS, products);

    // Record stock movement
    this.addStockMovement({
      productId: updated.id,
      productCode: updated.productCode,
      productName: updated.name,
      type: 'restock',
      previousQuantity: prevQty,
      quantityChanged: quantityToAdd,
      newQuantity: newQty,
      note: note || 'Inventory restocked',
      createdAt: now,
    });

    return { success: true, product: updated };
  }

  // --- SALES & CHECKOUT ---
  public completeSale(saleData: Omit<Sale, 'id' | 'receiptNumber'> & { createdAt?: string; ethiopianDate?: string; isBacklog?: boolean }): { success: boolean; message?: string; sale?: Sale } {
    const products = this.getProducts();
    const saleDate = saleData.createdAt ? new Date(saleData.createdAt) : new Date();
    const isBacklog = Boolean(saleData.isBacklog);

    // Verify stock availability for ALL items first
    for (const item of saleData.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, message: `Product "${item.productName}" (${item.productCode}) no longer exists.` };
      }
      if (prod.stockQuantity < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${prod.name}". Available: ${prod.stockQuantity}, requested: ${item.quantity}.`,
        };
      }
    }

    // Generate unique transaction reference based on Ethiopian date or sale date
    // e.g. TXN-20190128-0001 (Ethiopian) or TXN-20261008-0001
    const eth = toEthiopianDate(saleDate);
    const ethYyyy = eth.year;
    const ethMm = String(eth.month).padStart(2, '0');
    const ethDd = String(eth.day).padStart(2, '0');

    const yyyy = saleDate.getFullYear();
    const mm = String(saleDate.getMonth() + 1).padStart(2, '0');
    const dd = String(saleDate.getDate()).padStart(2, '0');

    const existingSales = this.getSales();
    const sameDateSalesCount = existingSales.filter((s) => s.createdAt.startsWith(`${yyyy}-${mm}-${dd}`)).length;
    const prefix = isBacklog ? 'BL-TXN' : 'TXN';
    const receiptNumber = `${prefix}-${ethYyyy}${ethMm}${ethDd}-${String(sameDateSalesCount + 1).padStart(4, '0')}`;

    const formattedEthDate = saleData.ethiopianDate || formatEthiopianDate(saleDate, { includeTime: true });

    const newSale: Sale = {
      ...saleData,
      id: 'sale-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      receiptNumber,
      createdAt: saleDate.toISOString(),
      ethiopianDate: formattedEthDate,
      isBacklog,
    };

    // Deduct stock and record movements
    for (const item of saleData.items) {
      const index = products.findIndex((p) => p.id === item.productId);
      if (index !== -1) {
        const prevStock = products[index].stockQuantity;
        const newStock = Math.max(0, prevStock - item.quantity);
        products[index] = {
          ...products[index],
          stockQuantity: newStock,
          updatedAt: new Date().toISOString(),
        };

        this.addStockMovement({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          type: 'sale',
          previousQuantity: prevStock,
          quantityChanged: -item.quantity,
          newQuantity: newStock,
          referenceId: receiptNumber,
          note: isBacklog
            ? `Back-log sale recorded for ${formattedEthDate} (#${receiptNumber})`
            : `Sale transaction #${receiptNumber} (${formattedEthDate})`,
          createdAt: saleDate.toISOString(),
        });
      }
    }

    // Save updated products and new sale (sorted with newest sales first)
    this.set(STORAGE_KEYS.PRODUCTS, products);
    existingSales.unshift(newSale); // add to list
    // Keep chronologically sorted (newest date first)
    existingSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.set(STORAGE_KEYS.SALES, existingSales);

    return { success: true, sale: newSale };
  }

  public getSales(): Sale[] {
    return this.get<Sale[]>(STORAGE_KEYS.SALES, []);
  }

  // --- STOCK MOVEMENTS ---
  public getStockMovements(): StockMovement[] {
    return this.get<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  }

  private addStockMovement(movement: Omit<StockMovement, 'id'>): void {
    const movements = this.getStockMovements();
    const newMovement: StockMovement = {
      ...movement,
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    movements.unshift(newMovement);
    // keep latest 1000 movements
    if (movements.length > 1000) {
      movements.length = 1000;
    }
    this.set(STORAGE_KEYS.MOVEMENTS, movements);
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return this.get<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  }

  public saveCategory(name: string, description?: string): Category {
    const categories = this.getCategories();
    const existing = categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: name.trim(),
      description,
    };
    categories.push(newCat);
    this.set(STORAGE_KEYS.CATEGORIES, categories);
    return newCat;
  }

  public renameCategory(id: string, newName: string): boolean {
    const categories = this.getCategories();
    const cat = categories.find((c) => c.id === id);
    if (!cat) return false;

    const oldName = cat.name;
    cat.name = newName.trim();
    this.set(STORAGE_KEYS.CATEGORIES, categories);

    // Update products using this category
    const products = this.getProducts();
    let updated = false;
    products.forEach((p) => {
      if (p.category === oldName) {
        p.category = cat.name;
        updated = true;
      }
    });
    if (updated) {
      this.set(STORAGE_KEYS.PRODUCTS, products);
    }
    return true;
  }

  public deleteCategory(id: string): { success: boolean; message?: string } {
    const categories = this.getCategories();
    const cat = categories.find((c) => c.id === id);
    if (!cat) return { success: false, message: 'Category not found' };

    // Check if products use this category
    const products = this.getProducts();
    const inUse = products.some((p) => p.category === cat.name);
    if (inUse) {
      return { success: false, message: `Cannot delete category "${cat.name}" because it is assigned to products. Reassign or delete those products first.` };
    }

    const filtered = categories.filter((c) => c.id !== id);
    this.set(STORAGE_KEYS.CATEGORIES, filtered);
    return { success: true };
  }

  private ensureCategoryExists(categoryName: string): void {
    if (!categoryName) return;
    const categories = this.getCategories();
    if (!categories.some((c) => c.name.toLowerCase() === categoryName.trim().toLowerCase())) {
      this.saveCategory(categoryName);
    }
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    const s = this.get<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...s,
      shopName: SHOP_NAME,
      calendarPreference: s.calendarPreference || 'ethiopian',
      enableBacklogSales: s.enableBacklogSales !== undefined ? s.enableBacklogSales : true,
    };
  }

  public updateSettings(settings: Partial<AppSettings>, operatorRole?: string): AppSettings {
    if (operatorRole === 'cashier') {
      return this.getSettings();
    }
    const current = this.getSettings();
    const updated = { ...current, ...settings, shopName: SHOP_NAME };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- USER / AUTH ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  public getActiveSession(): User | null {
    return this.get<User | null>(STORAGE_KEYS.CURRENT_SESSION, null);
  }

  public login(
    username: string,
    password?: string
  ): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const cleanUser = username.trim().toLowerCase();
    const found = users.find((u) => u.username.toLowerCase() === cleanUser);

    if (!found) {
      return { success: false, message: 'Invalid username or password.' };
    }

    if (found.password && password !== undefined) {
      if (found.password !== password) {
        return { success: false, message: 'Invalid username or password.' };
      }
    }

    const sessionUser: User = {
      id: found.id,
      name: found.name,
      role: found.role,
      username: found.username,
    };
    this.set(STORAGE_KEYS.CURRENT_SESSION, sessionUser);
    return { success: true, user: sessionUser };
  }

  public logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    } catch {}
  }

  public saveUser(user: User, operatorRole?: string): { success: boolean; message?: string } {
    if (operatorRole === 'cashier') {
      return { success: false, message: 'Unauthorized: Cashiers cannot manage user accounts.' };
    }
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
    return { success: true };
  }

  public getCurrentUser(): User {
    const session = this.getActiveSession();
    return session || DEFAULT_USERS[0];
  }

  public setCurrentUser(user: User): void {
    this.set(STORAGE_KEYS.CURRENT_SESSION, user);
  }

  // --- BATCH IMPORT ---
  public batchImportProducts(newProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): {
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    errors: string[];
  } {
    const currentProducts = this.getProducts();
    const now = new Date().toISOString();
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    newProducts.forEach((p, idx) => {
      const code = p.productCode?.trim().toUpperCase();
      if (!code) {
        errors.push(`Row ${idx + 1}: Missing product code. Skipped.`);
        skippedCount++;
        return;
      }
      if (!p.name?.trim()) {
        errors.push(`Row ${idx + 1}: Missing product name for code ${code}. Skipped.`);
        skippedCount++;
        return;
      }

      const existingIndex = currentProducts.findIndex(
        (curr) => curr.productCode.toUpperCase() === code
      );

      if (existingIndex !== -1) {
        // Update existing product without creating duplicate
        currentProducts[existingIndex] = {
          ...currentProducts[existingIndex],
          name: p.name.trim(),
          category: p.category?.trim() || currentProducts[existingIndex].category || 'General',
          costPrice: Number(p.costPrice) || currentProducts[existingIndex].costPrice || 0,
          sellingPrice: Number(p.sellingPrice) || currentProducts[existingIndex].sellingPrice || 0,
          stockQuantity: Number(p.stockQuantity) >= 0 ? Number(p.stockQuantity) : currentProducts[existingIndex].stockQuantity,
          minStockThreshold: Number(p.minStockThreshold) >= 0 ? Number(p.minStockThreshold) : currentProducts[existingIndex].minStockThreshold,
          unit: p.unit?.trim() || currentProducts[existingIndex].unit || 'pcs',
          description: p.description?.trim() || currentProducts[existingIndex].description,
          sku: p.sku?.trim() || currentProducts[existingIndex].sku,
          updatedAt: now,
        };
        updatedCount++;
      } else {
        // Insert new product
        const newProduct: Product = {
          ...p,
          id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          productCode: code,
          category: p.category?.trim() || 'General',
          costPrice: Number(p.costPrice) || 0,
          sellingPrice: Number(p.sellingPrice) || 0,
          stockQuantity: Number(p.stockQuantity) >= 0 ? Number(p.stockQuantity) : 0,
          minStockThreshold: Number(p.minStockThreshold) >= 0 ? Number(p.minStockThreshold) : 5,
          unit: p.unit?.trim() || 'pcs',
          description: p.description?.trim() || '',
          sku: p.sku?.trim(),
          createdAt: now,
          updatedAt: now,
        };
        currentProducts.push(newProduct);
        importedCount++;
      }

      if (p.category) {
        this.ensureCategoryExists(p.category.trim());
      }
    });

    this.set(STORAGE_KEYS.PRODUCTS, currentProducts);
    return { importedCount, updatedCount, skippedCount, errors };
  }

  // --- FULL BACKUP & RESTORE ---
  public exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      categories: this.getCategories(),
      sales: this.getSales(),
      movements: this.getStockMovements(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public restoreFullBackup(jsonString: string, operatorRole?: string): { success: boolean; message?: string } {
    if (operatorRole === 'cashier') {
      return { success: false, message: 'Unauthorized: Cashiers cannot restore backups.' };
    }
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !Array.isArray(data.products)) {
        return { success: false, message: 'Invalid backup file: missing products array.' };
      }

      this.set(STORAGE_KEYS.PRODUCTS, data.products);
      if (Array.isArray(data.categories)) this.set(STORAGE_KEYS.CATEGORIES, data.categories);
      if (Array.isArray(data.sales)) this.set(STORAGE_KEYS.SALES, data.sales);
      if (Array.isArray(data.movements)) this.set(STORAGE_KEYS.MOVEMENTS, data.movements);
      if (data.settings) {
        this.set(STORAGE_KEYS.SETTINGS, { ...data.settings, shopName: SHOP_NAME });
      }

      return { success: true };
    } catch {
      return { success: false, message: 'Failed to parse JSON backup file.' };
    }
  }

  // Completely wipe and remove everything from the database
  public removeAllData(): void {
    this.set(STORAGE_KEYS.PRODUCTS, []);
    this.set(STORAGE_KEYS.CATEGORIES, []);
    this.set(STORAGE_KEYS.SALES, []);
    this.set(STORAGE_KEYS.MOVEMENTS, []);
    this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.HAS_SEEDED, 'true');
  }

  // Restore demo catalog (sample products and categories)
  public restoreSampleProducts(): void {
    this.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.set(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.set(STORAGE_KEYS.SALES, []);
    this.set(STORAGE_KEYS.MOVEMENTS, []);
    this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.HAS_SEEDED, 'true');
  }

  // Reset means remove everything
  public resetToFactoryDefaults(): void {
    this.removeAllData();
  }
}

export const storage = new StorageService();
// Initialize storage
storage.init();
