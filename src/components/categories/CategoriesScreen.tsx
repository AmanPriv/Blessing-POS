import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Check, X, AlertCircle, Lock } from 'lucide-react';
import { Category, Product, User } from '../../types';
import { storage } from '../../services/storage';

interface CategoriesScreenProps {
  categories: Category[];
  products: Product[];
  currentUser: User;
  onRefresh: () => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  categories,
  products,
  currentUser,
  onRefresh,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          Category management is restricted to store administrators.
        </p>
      </div>
    );
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newCatName.trim()) return;

    if (
      categories.some(
        (c) => c.name.toLowerCase() === newCatName.trim().toLowerCase()
      )
    ) {
      setErrorMessage(`Category "${newCatName.trim()}" already exists.`);
      return;
    }

    storage.saveCategory(newCatName.trim());
    setNewCatName('');
    onRefresh();
  };

  const handleStartRename = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setErrorMessage(null);
  };

  const handleSaveRename = (id: string) => {
    if (!editCatName.trim()) return;
    const success = storage.renameCategory(id, editCatName.trim());
    if (success) {
      setEditingCatId(null);
      onRefresh();
    }
  };

  const handleDelete = (cat: Category) => {
    setErrorMessage(null);
    const count = products.filter((p) => p.category === cat.name).length;
    if (count > 0) {
      setErrorMessage(
        `Cannot remove "${cat.name}": ${count} product(s) are currently in this category. Reassign them first.`
      );
      return;
    }

    const res = storage.deleteCategory(cat.id);
    if (!res.success) {
      setErrorMessage(res.message || 'Failed to delete category.');
    } else {
      onRefresh();
    }
  };

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: '#6B1E2B' }}
        >
          Product Categories
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6E6460' }}>
          Organize your shop catalog into departments and sections for faster lookup.
        </p>
      </div>

      {errorMessage && (
        <div
          className="p-4 border text-sm rounded-xl flex items-center justify-between"
          style={{
            backgroundColor: '#FDF2F3',
            borderColor: '#F5C6CB',
            color: '#6B1E2B',
          }}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" style={{ color: '#6B1E2B' }} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="hover:opacity-75 cursor-pointer"
            style={{ color: '#6E6460' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add New Category Form (Admin only) */}
      <div
        className="p-5 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: '#2B2523' }}
        >
          Add New Category
        </h3>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Fresh Produce, Stationeries, Canned Goods..."
            className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          />
          <button
            type="submit"
            className="px-5 py-2.5 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            style={{
              backgroundColor: '#6B1E2B',
              boxShadow: '0 4px 12px rgba(107, 30, 43, 0.25)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Categories List Table */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{
          backgroundColor: '#FFFDF8',
          borderColor: '#E6DCCB',
        }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: '#E6DCCB',
            backgroundColor: '#FFF8E7',
          }}
        >
          <span className="font-bold text-sm" style={{ color: '#2B2523' }}>
            All Categories ({categories.length})
          </span>
          <span className="text-xs" style={{ color: '#6E6460' }}>
            {products.length} products assigned
          </span>
        </div>

        <div className="divide-y" style={{ borderColor: '#E6DCCB' }}>
          {categories.map((cat) => {
            const productCount = products.filter((p) => p.category === cat.name).length;
            const isEditing = editingCatId === cat.id;

            return (
              <div
                key={cat.id}
                className="p-4 flex items-center justify-between hover:bg-[#FFF8E7]/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#F7EBED', color: '#6B1E2B' }}
                  >
                    <Tag className="w-4 h-4" />
                  </div>

                  {isEditing ? (
                    <div className="flex items-center space-x-2 flex-1 max-w-sm">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm outline-none font-medium"
                        style={{
                          backgroundColor: '#FFF8E7',
                          borderColor: '#6B1E2B',
                          color: '#2B2523',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(cat.id)}
                        className="p-1.5 text-white rounded-lg cursor-pointer"
                        style={{ backgroundColor: '#6B1E2B' }}
                        title="Save Rename"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1.5 border rounded-lg cursor-pointer"
                        style={{
                          backgroundColor: '#FFF8E7',
                          borderColor: '#E6DCCB',
                          color: '#2B2523',
                        }}
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-sm" style={{ color: '#2B2523' }}>
                        {cat.name}
                      </div>
                      <div className="text-xs" style={{ color: '#6E6460' }}>
                        {productCount} product{productCount === 1 ? '' : 's'} in category
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStartRename(cat)}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                      style={{ color: '#6E6460' }}
                      title="Rename Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={productCount > 0}
                      className={`p-1.5 rounded-lg transition-colors ${
                        productCount > 0
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-red-50 hover:text-red-700 cursor-pointer'
                      }`}
                      style={{ color: '#6E6460' }}
                      title={
                        productCount > 0
                          ? 'Cannot delete category while products are assigned'
                          : 'Delete Category'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="p-8 text-center text-xs font-medium" style={{ color: '#6E6460' }}>
              No categories yet. Use the form above to add your first category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
