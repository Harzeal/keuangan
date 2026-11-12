import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Pencil,
  Check,
  FolderPlus
} from 'lucide-react';
import { Category, MainCategory } from '../../types/database';

interface CategoryManagerModalProps {
  categories: Category[];
  onClose: () => void;
  onAddCategory: (cat: {
    name: string;
    main_category: MainCategory;
    icon?: string;
    color?: string;
  }) => Promise<{ error: any; data: any }>;
  onUpdateCategory?: (
    id: string,
    updates: { name: string; main_category?: MainCategory; color?: string }
  ) => Promise<{ error: any }>;
  onDeleteCategory: (id: string) => Promise<{ error: any }>;
}

const COLOR_OPTIONS = [
  '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b',
  '#f97316', '#8b5cf6', '#14b8a6', '#e11d48', '#3b82f6'
];

const ALLOCATION_LABELS: Record<MainCategory, string> = {
  needs: 'Kebutuhan',
  wants: 'Keinginan',
  savings: 'Tabungan',
  income: 'Pemasukan'
};

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [name, setName] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('needs');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter tab daftar kategori yang ada
  const [filterTab, setFilterTab] = useState<'all' | MainCategory>('all');

  // State untuk Edit Kategori yang sudah ada
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMainCategory, setEditMainCategory] = useState<MainCategory>('needs');
  const [editColor, setEditColor] = useState('#6366f1');
  const [savingEdit, setSavingEdit] = useState(false);

  // Tutup modal ketika tombol Escape (ESC) ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, editingId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const { error: err } = await onAddCategory({
      name: name.trim(),
      main_category: mainCategory,
      color,
      icon: 'Tag'
    });

    setLoading(false);
    if (err) {
      setError(err.message || 'Gagal menambahkan kategori.');
    } else {
      setName('');
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditMainCategory(cat.main_category);
    setEditColor(cat.color || '#6366f1');
  };

  const handleSaveEdit = async (id: string) => {
    if (!onUpdateCategory || !editName.trim()) return;
    setSavingEdit(true);
    await onUpdateCategory(id, {
      name: editName.trim(),
      main_category: editMainCategory,
      color: editColor
    });
    setSavingEdit(false);
    setEditingId(null);
  };

  const handleDelete = async (cat: Category) => {
    if (confirm(`Hapus kategori "${cat.name}"?`)) {
      await onDeleteCategory(cat.id);
    }
  };

  const filteredCategories = categories.filter((c) =>
    filterTab === 'all' ? true : c.main_category === filterTab
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-8 sm:pt-12 pb-8 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-2"
      >
        <button
          onClick={onClose}
          title="Tutup (Esc)"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Kelola Semua Kategori
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tambah, ubah nama, atau hapus kategori yang ada
              </p>
            </div>
          </div>
        </div>

        {/* Form Tambah Kategori Baru */}
        <form
          onSubmit={handleCreate}
          className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 mb-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Tambah Kategori Baru
          </h3>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Nama Kategori
            </label>
            <input
              type="text"
              placeholder="Contoh: Skincare / Kopi Susu / Gym"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Alokasi Utama
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-[11px] sm:text-xs font-semibold">
              {(['needs', 'wants', 'savings', 'income'] as MainCategory[]).map((mc) => (
                <button
                  key={mc}
                  type="button"
                  onClick={() => setMainCategory(mc)}
                  className={`py-1.5 px-1.5 rounded-lg border text-center transition ${
                    mainCategory === mc
                      ? 'bg-[#113932] text-white border-[#113932] font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {ALLOCATION_LABELS[mc]}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Warna Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full mt-1 py-2 px-3 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </form>

        {/* Daftar Seluruh Kategori yang Ada (Bisa Edit Nama & Hapus) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Daftar Kategori yang Ada ({filteredCategories.length})
            </h3>
            <span className="text-[10px] text-slate-400">
              Klik ✏️ untuk ubah nama / 🗑️ hapus
            </span>
          </div>

          {/* Filter Tab Alokasi */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2.5 scrollbar-none text-[11px] font-semibold">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'needs', label: 'Kebutuhan' },
              { id: 'wants', label: 'Keinginan' },
              { id: 'savings', label: 'Tabungan' },
              { id: 'income', label: 'Pemasukan' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterTab(t.id as any)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                  filterTab === t.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Tidak ada kategori pada filter ini.
              </p>
            ) : (
              filteredCategories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
                  >
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nama kategori..."
                            className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-emerald-400 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                          <select
                            value={editMainCategory}
                            onChange={(e) => setEditMainCategory(e.target.value as MainCategory)}
                            className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                          >
                            <option value="needs">Kebutuhan</option>
                            <option value="wants">Keinginan</option>
                            <option value="savings">Tabungan</option>
                            <option value="income">Pemasukan</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {COLOR_OPTIONS.slice(0, 7).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditColor(c)}
                                className={`w-4 h-4 rounded-full ${
                                  editColor === c ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-110' : ''
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={savingEdit || !editName.trim()}
                              onClick={() => handleSaveEdit(cat.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color || '#6366f1' }}
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                            {ALLOCATION_LABELS[cat.main_category] || cat.main_category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onUpdateCategory && (
                            <button
                              type="button"
                              onClick={() => startEditing(cat)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                              title="Edit Nama & Warna Kategori"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tombol Selesai */}
        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition shadow-sm"
          >
            Selesai / Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
