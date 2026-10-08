import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Database,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  RotateCcw,
  RefreshCw,
  X,
  Lock,
  Trash2,
} from 'lucide-react';
import { Product, Sale, AppSettings, User, SHOP_NAME } from '../../types';
import {
  parseExcelFile,
  convertRowsToProducts,
  ColumnMapping,
  ParsedSheetData,
  downloadSampleExcelTemplate,
  exportProductsToExcel,
  exportSalesToExcel,
} from '../../services/excelService';
import { storage } from '../../services/storage';

interface ImportExportScreenProps {
  products: Product[];
  sales: Sale[];
  settings: AppSettings;
  currentUser: User;
  onRefreshAll: () => void;
}

export const ImportExportScreen: React.FC<ImportExportScreenProps> = ({
  products,
  sales,
  settings,
  currentUser,
  onRefreshAll,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message: string;
    imported?: number;
    updated?: number;
    skipped?: number;
    errors?: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pendingRestoreText, setPendingRestoreText] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return (
      <div
        className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-4"
        style={{ color: '#2B2523' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border"
          style={{
            backgroundColor: '#FDF2F3',
            borderColor: '#F5C6CB',
            color: '#6B1E2B',
          }}
        >
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: '#6B1E2B' }}>
          Administrator Access Required
        </h2>
        <p className="text-sm" style={{ color: '#6E6460' }}>
          Data importing and full database restore are restricted to administrators.
        </p>
      </div>
    );
  }

  // Handle Excel file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setImportStatus(null);
      const data = await parseExcelFile(file);
      setParsedData(data);
      setColumnMapping(data.detectedMapping);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Failed to read spreadsheet.',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Execute import
  const handleExecuteImport = () => {
    if (!parsedData || !columnMapping) return;

    if (!columnMapping.productCode) {
      setImportStatus({
        success: false,
        message: 'Please select which column represents the Product Code (unique identifier).',
      });
      return;
    }

    try {
      setIsProcessing(true);
      const converted = convertRowsToProducts(
        parsedData.rawRows,
        columnMapping,
        settings.defaultMinStockThreshold
      );

      if (converted.length === 0) {
        setImportStatus({
          success: false,
          message: 'No valid products found in the file with code and name.',
        });
        setIsProcessing(false);
        return;
      }

      const result = storage.batchImportProducts(converted);
      onRefreshAll();

      setImportStatus({
        success: true,
        message: `Successfully processed ${converted.length} products into ${SHOP_NAME}.`,
        imported: result.importedCount,
        updated: result.updatedCount,
        skipped: result.skippedCount,
        errors: result.errors,
      });

      // Clear preview
      setParsedData(null);
      setColumnMapping(null);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Error occurred while saving products.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Full backup JSON download
  const handleDownloadBackup = () => {
    const jsonStr = storage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blessing_shop_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore backup file selection
  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setPendingRestoreText(text);
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Failed to read the backup file.',
      });
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  const executeRestoreBackup = () => {
    if (!pendingRestoreText) return;
    try {
      const res = storage.restoreFullBackup(pendingRestoreText, currentUser.role);
      setPendingRestoreText(null);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: 'System restored from backup successfully!',
        });
        onRefreshAll();
      } else {
        setActionFeedback({
          type: 'error',
          message: res.message || 'Restore failed.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to restore backup.',
      });
    }
  };

  // Reset all data (remove everything)
  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  const executeResetDefaults = () => {
    try {
      storage.removeAllData();
      onRefreshAll();
      setIsResetModalOpen(false);
      setActionFeedback({
        type: 'success',
        message: 'Everything has been removed successfully! All products, sales records, inventory movements, and categories have been completely cleared.',
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to remove data.',
      });
    }
  };

  const handleRestoreSampleProducts = () => {
    try {
      storage.restoreSampleProducts();
      onRefreshAll();
      setActionFeedback({
        type: 'success',
        message: 'Sample demo products and categories have been restored successfully.',
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to load sample products.',
      });
    }
  };

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: '#6B1E2B' }}
        >
          Excel Import, Export &amp; Backup
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6E6460' }}>
          Import your spreadsheet catalog, preserve product codes, and create backups.
        </p>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold transition-all shadow-sm ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 rounded-md hover:bg-black/5 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Result Status Message */}
      {importStatus && (
        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: importStatus.success ? '#F7EBED' : '#FDF2F3',
            borderColor: importStatus.success ? '#E6DCCB' : '#F5C6CB',
            color: '#6B1E2B',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {importStatus.success ? (
                <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#6B1E2B' }} />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#6B1E2B' }} />
              )}
              <h4 className="font-bold text-base">{importStatus.message}</h4>
            </div>
            <button
              onClick={() => setImportStatus(null)}
              className="hover:opacity-75 cursor-pointer"
              style={{ color: '#6E6460' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {importStatus.success && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span
                className="px-2.5 py-1 rounded-lg border"
                style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB', color: '#6B1E2B' }}
              >
                + {importStatus.imported} New Products Added
              </span>
              <span
                className="px-2.5 py-1 rounded-lg border"
                style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB', color: '#2B2523' }}
              >
                ⟳ {importStatus.updated} Existing Products Updated
              </span>
              {importStatus.skipped! > 0 && (
                <span
                  className="px-2.5 py-1 rounded-lg border"
                  style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', color: '#92400E' }}
                >
                  ⚠ {importStatus.skipped} Skipped (Invalid/Empty Code)
                </span>
              )}
            </div>
          )}

          {importStatus.errors && importStatus.errors.length > 0 && (
            <div
              className="mt-3 text-xs p-3 rounded-lg max-h-36 overflow-y-auto font-mono border"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB', color: '#6B1E2B' }}
            >
              {importStatus.errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 1: IMPORT SPREADSHEET CARD */}
      <div
        className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#6B1E2B' }}
            >
              Product Database Importer
            </span>
            <h2 className="text-xl font-bold mt-0.5" style={{ color: '#2B2523' }}>
              Import Your Excel File (.xlsx, .xls, .csv)
            </h2>
            <p className="text-xs sm:text-sm mt-1 max-w-xl" style={{ color: '#6E6460' }}>
              Upload your shop inventory file. The system automatically inspects sheet headers,
              maps columns, preserves your existing product codes, and updates stock without duplicates.
            </p>
          </div>

          <button
            onClick={downloadSampleExcelTemplate}
            className="flex items-center space-x-1.5 px-3.5 py-2 border text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            <Download className="w-4 h-4" style={{ color: '#6B1E2B' }} />
            <span>Download Sample Excel</span>
          </button>
        </div>

        {/* Upload Dropzone */}
        {!parsedData && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group"
            style={{
              borderColor: '#E6DCCB',
              backgroundColor: '#FFF8E7',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet
              className="w-12 h-12 mx-auto mb-3 transition-colors"
              style={{ color: '#6B1E2B' }}
            />
            <h3 className="font-bold text-base" style={{ color: '#2B2523' }}>
              Click to select or drag your Excel file here
            </h3>
            <p className="text-xs mt-1" style={{ color: '#6E6460' }}>
              Supports .xlsx, .xls, and .csv formats. Your existing product codes will become the POS identifiers.
            </p>
          </div>
        )}

        {/* Column Mapping Interface & Preview */}
        {parsedData && columnMapping && (
          <div className="space-y-6 pt-2 border-t" style={{ borderColor: '#E6DCCB' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base" style={{ color: '#2B2523' }}>
                  Map Spreadsheet Columns
                </h3>
                <p className="text-xs" style={{ color: '#6E6460' }}>
                  Sheet: <span className="font-semibold">{parsedData.sheetName}</span> • Total rows detected: {parsedData.rawRows.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setParsedData(null);
                  setColumnMapping(null);
                }}
                className="text-xs underline cursor-pointer"
                style={{ color: '#6B1E2B' }}
              >
                Change File
              </button>
            </div>

            {/* Column selection grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 rounded-2xl border"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
              }}
            >
              {/* Product Code */}
              <div>
                <label className="block text-xs font-bold mb-1 flex items-center justify-between" style={{ color: '#2B2523' }}>
                  <span>Product Code * (Unique)</span>
                  <span className="text-[10px] font-semibold" style={{ color: '#6B1E2B' }}>POS Key</span>
                </label>
                <select
                  value={columnMapping.productCode}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, productCode: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="">-- Select Column --</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#2B2523' }}>
                  Product Name *
                </label>
                <select
                  value={columnMapping.name}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, name: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="">-- Select Column --</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#2B2523' }}>
                  Selling Price ({settings.currency})
                </label>
                <select
                  value={columnMapping.sellingPrice}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, sellingPrice: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="">-- None / Default 0 --</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#2B2523' }}>
                  Stock Quantity
                </label>
                <select
                  value={columnMapping.stockQuantity}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, stockQuantity: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="">-- None / Default 0 --</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#2B2523' }}>
                  Category
                </label>
                <select
                  value={columnMapping.category}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, category: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="">-- None / General --</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#2B2523' }}>
                  Cost Price ({settings.currency})
                </label>
                <select
                  value={columnMapping.costPrice}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, costPrice: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E6DCCB',
                    color: '#2B2523',
                  }}
                >
                  <option value="">-- None / 0 --</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setParsedData(null);
                  setColumnMapping(null);
                }}
                className="px-4 py-2.5 border rounded-xl text-xs font-semibold cursor-pointer"
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
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="px-6 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                style={{
                  backgroundColor: '#6B1E2B',
                  boxShadow: '0 4px 14px rgba(107, 30, 43, 0.3)',
                }}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Importing...'
                    : `Confirm & Import ${parsedData.rawRows.length} Products`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: BACKUP & RESTORE / EXPORT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export to Excel */}
        <div
          className="rounded-2xl p-6 border shadow-sm space-y-4"
          style={{
            backgroundColor: '#FFFDF8',
            borderColor: '#E6DCCB',
          }}
        >
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5" style={{ color: '#6B1E2B' }} />
            <h3 className="font-bold text-base" style={{ color: '#2B2523' }}>
              Export Data to Excel
            </h3>
          </div>
          <p className="text-xs" style={{ color: '#6E6460' }}>
            Export current products catalog and transaction records as formatted Microsoft Excel spreadsheets.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => exportProductsToExcel(products)}
              className="w-full py-2.5 px-4 border rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            >
              <span>Export Products Catalog ({products.length} items)</span>
              <FileSpreadsheet className="w-4 h-4" style={{ color: '#6B1E2B' }} />
            </button>

            <button
              onClick={() => exportSalesToExcel(sales)}
              className="w-full py-2.5 px-4 border rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            >
              <span>Export Sales History ({sales.length} transactions)</span>
              <FileSpreadsheet className="w-4 h-4" style={{ color: '#6B1E2B' }} />
            </button>
          </div>
        </div>

        {/* Full System Backup & Restore */}
        <div
          className="rounded-2xl p-6 border shadow-sm space-y-4"
          style={{
            backgroundColor: '#FFFDF8',
            borderColor: '#E6DCCB',
          }}
        >
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5" style={{ color: '#6B1E2B' }} />
            <h3 className="font-bold text-base" style={{ color: '#2B2523' }}>
              Full System Backup
            </h3>
          </div>
          <p className="text-xs" style={{ color: '#6E6460' }}>
            Preserve products, categories, sales history, stock movements, and settings into a JSON archive.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 px-4 text-white rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              style={{
                backgroundColor: '#6B1E2B',
                boxShadow: '0 4px 10px rgba(107, 30, 43, 0.25)',
              }}
            >
              <span>Download Complete Backup (.json)</span>
              <Download className="w-4 h-4" />
            </button>

            <div className="relative">
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreBackupFile}
                className="hidden"
              />
              <button
                onClick={() => backupInputRef.current?.click()}
                className="w-full py-2.5 px-4 border rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#FFF8E7',
                  borderColor: '#E6DCCB',
                  color: '#2B2523',
                }}
              >
                <span>Restore From Backup (.json)</span>
                <Upload className="w-4 h-4" style={{ color: '#6E6460' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Reset Danger Zone */}
      <div
        className="rounded-2xl p-6 border space-y-4"
        style={{
          backgroundColor: '#FDF2F3',
          borderColor: '#F5C6CB',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm" style={{ color: '#6B1E2B' }}>
              Reset System (Remove Everything)
            </h4>
            <p className="text-xs mt-0.5" style={{ color: '#6E6460' }}>
              Permanently wipe and remove all products, sales history, stock movements, and categories. Leaves the store completely empty.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreSampleProducts}
              className="px-3.5 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center space-x-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>Load Sample Demo Products</span>
            </button>
            <button
              type="button"
              onClick={handleOpenResetModal}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center space-x-2 shadow-sm"
              style={{
                backgroundColor: '#6B1E2B',
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset &amp; Remove Everything</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FDF2F3', color: '#6B1E2B' }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base" style={{ color: '#6B1E2B' }}>
                  Reset &amp; Remove Everything?
                </h3>
                <p className="text-xs" style={{ color: '#6E6460' }}>
                  Wipe all store data and start completely fresh
                </p>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border text-xs leading-relaxed space-y-2"
              style={{
                backgroundColor: '#FFF8E7',
                borderColor: '#E6DCCB',
                color: '#2B2523',
              }}
            >
              <p className="font-bold text-rose-800">
                Are you sure you want to remove everything?
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-neutral-700 text-xs">
                <li><strong className="text-rose-900">All products</strong> will be permanently deleted (0 products remaining)</li>
                <li><strong className="text-rose-900">All sales history</strong> will be permanently wiped (0 transactions)</li>
                <li><strong className="text-rose-900">All inventory movements</strong> and restock logs will be cleared</li>
                <li><strong className="text-rose-900">All categories</strong> will be removed</li>
              </ul>
              <p className="text-neutral-500 italic text-[11px] pt-1">
                Tip: You can export an Excel or download a JSON backup above before resetting if you want to save a copy.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
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
                onClick={executeResetDefaults}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow active:scale-95 flex items-center space-x-1.5"
                style={{
                  backgroundColor: '#6B1E2B',
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Remove Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Modal */}
      {pendingRestoreText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            style={{
              backgroundColor: '#FFFDF8',
              borderColor: '#E6DCCB',
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FDF2F3', color: '#6B1E2B' }}
              >
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base" style={{ color: '#6B1E2B' }}>
                  Restore From Backup File?
                </h3>
                <p className="text-xs" style={{ color: '#6E6460' }}>
                  Replace current data with backup
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed">
              Restoring will replace current inventory, transactions, and settings with the contents of the uploaded backup file.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingRestoreText(null)}
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
                onClick={executeRestoreBackup}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow active:scale-95 flex items-center space-x-1.5"
                style={{
                  backgroundColor: '#6B1E2B',
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Confirm Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
