import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Tag,
  Check,
  FolderPlus,
  Home,
  ShoppingBag,
  ShieldCheck,
  ArrowUpCircle
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
  onDeleteCategory: (id: string) => Promise<{ error: any }>;
}

const COLOR_OPTIONS = [
  '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b',
  '#f97316', '#8b5cf6', '#14b8a6', '#e11d48', '#3b82f6'
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categories,
  onClose,
  onAddCategory,
  onDeleteCategory
}) => {
  const [name, setName] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('needs');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const userCustomCategories = categories.filter((c) => !c.is_default);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Kelola Kategori Kustom
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tambah sub-kategori pengeluaran pribadi yang tersimpan ke cloud
              </p>
            </div>
          </div>
        </div>

        {/* Form Tambah Kategori Baru */}
        <form onSubmit={handleCreate} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Tambah Kategori Baru
          </h3>

          {error && (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Nama Kategori
            </label>
            <input
              type="text"
              placeholder="Contoh: Skincare / Kopi Susu / Gym"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Alokasi Utama
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMainCategory('needs')}
                className={`py-1.5 px-2 rounded-lg border text-center transition ${
                  mainCategory === 'needs'
                    ? 'bg-sky-50 dark:bg-sky-950 border-sky-400 text-sky-700 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Kebutuhan
              </button>
              <button
                type="button"
                onClick={() => setMainCategory('wants')}
                className={`py-1.5 px-2 rounded-lg border text-center transition ${
                  mainCategory === 'wants'
                    ? 'bg-amber-50 dark:bg-amber-950 border-amber-400 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Keinginan
              </button>
              <button
                type="button"
                onClick={() => setMainCategory('savings')}
                className={`py-1.5 px-2 rounded-lg border text-center transition ${
                  mainCategory === 'savings'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Tabungan
              </button>
              <button
                type="button"
                onClick={() => setMainCategory('income')}
                className={`py-1.5 px-2 rounded-lg border text-center transition ${
                  mainCategory === 'income'
                    ? 'bg-green-50 dark:bg-green-950 border-green-400 text-green-700 dark:text-green-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Pemasukan
              </button>
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
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-brand-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full mt-2 py-2 px-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Simpan Kategori Kustom</span>
          </button>
        </form>

        {/* Daftar Kategori Kustom Milik User */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            Kategori Kustom Anda ({userCustomCategories.length})
          </h3>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {userCustomCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada kategori kustom tambahan. Kategori bawaan standar sudah siap digunakan.
              </p>
            ) : (
              userCustomCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase font-bold">
                      {cat.main_category}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
};
