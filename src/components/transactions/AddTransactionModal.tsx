import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  X,
  Plus,
  Calendar,
  Tag,
  FileText,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  FolderPlus,
  Home,
  ShoppingBag,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Category, MainCategory } from '../../types/database';
import { formatRupiah, parseRupiahInput, terbilang } from '../../lib/utils';

interface AddTransactionModalProps {
  categories: Category[];
  onClose: () => void;
  onSubmit: (tx: {
    type: 'income' | 'expense';
    amount: number;
    title: string;
    main_category: MainCategory;
    category_name: string;
    category_id?: string | null;
    date: string;
    notes?: string;
  }) => Promise<{ error: any; data: any }>;
  onOpenCategoryManager: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  categories,
  onClose,
  onSubmit,
  onOpenCategoryManager
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('needs');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tutup modal ketika tombol Escape (ESC) ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Filter sub-kategori sesuai mainCategory dan type
  const availableCategories = categories.filter((c) => {
    if (type === 'income') return c.main_category === 'income';
    return c.main_category === mainCategory;
  });

  // Nilai nominal murni
  const amountNumber = parseRupiahInput(amountStr);

  // Quick Amount Chips
  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];

  const handleAddQuickAmount = (val: number) => {
    const current = parseRupiahInput(amountStr);
    const updated = current + val;
    setAmountStr(updated.toLocaleString('id-ID'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amountNumber <= 0) {
      setError('Nominal harus lebih dari Rp 0.');
      return;
    }

    if (!title.trim()) {
      setError('Harap masukkan keterangan transaksi.');
      return;
    }

    // Tentukan kategori nama
    let catName = selectedCategoryName;
    let catId = selectedCategoryId;

    if (!catName && availableCategories.length > 0) {
      catName = availableCategories[0].name;
      catId = availableCategories[0].id;
    } else if (!catName) {
      catName = type === 'income' ? 'Pemasukan Lainnya' : 'Pengeluaran Umum';
    }

    setLoading(true);

    const { error: submitErr } = await onSubmit({
      type,
      amount: amountNumber,
      title: title.trim(),
      main_category: type === 'income' ? 'income' : mainCategory,
      category_name: catName,
      category_id: catId,
      date,
      notes: title.trim()
    });

    setLoading(false);

    if (submitErr) {
      setError(submitErr.message || 'Gagal menyimpan transaksi.');
    } else {
      // Efek selebrasi confetti jika transaksi pemasukan atau tabungan
      if (type === 'income' || mainCategory === 'savings') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 pb-8 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          title="Tutup (Esc)"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Catat Transaksi Keuangan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Setiap catatan otomatis memperbarui limit harian dan alokasi anggaran Anda
          </p>
        </div>

        {/* Tipe Transaksi: Pengeluaran vs Pemasukan */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setSelectedCategoryName('');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Pengeluaran (Expense)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('income');
              setSelectedCategoryName('');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Pemasukan (Income)</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Input Nominal Rupiah */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Jumlah Uang (Nominal)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-base text-slate-400">
                Rp
              </span>
              <input
                type="text"
                autoFocus
                placeholder="0"
                value={amountStr}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  if (!raw) {
                    setAmountStr('');
                  } else {
                    setAmountStr(parseInt(raw, 10).toLocaleString('id-ID'));
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-xl sm:text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            {/* Terbilang Preview */}
            <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400 italic mt-1.5 px-1 truncate">
              {amountNumber > 0 ? terbilang(amountNumber) : 'Masukkan nominal transaksi'}
            </p>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddQuickAmount(val)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000} rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Pos Alokasi Utama (Hanya untuk Pengeluaran) */}
          {type === 'expense' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Alokasi Pos Keuangan (50 / 20 / 30)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMainCategory('needs');
                    setSelectedCategoryName('');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    mainCategory === 'needs'
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-400 text-sky-700 dark:text-sky-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Home className="w-4 h-4 text-sky-500" />
                  <span className="text-xs">Kebutuhan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMainCategory('wants');
                    setSelectedCategoryName('');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    mainCategory === 'wants'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-700 dark:text-amber-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span className="text-xs">Keinginan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMainCategory('savings');
                    setSelectedCategoryName('');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    mainCategory === 'savings'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs">Tabungan</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Kategori */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kategori Spesifik
              </label>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Kategori Kustom</span>
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedCategoryName}
                onChange={(e) => {
                  setSelectedCategoryName(e.target.value);
                  const found = categories.find((c) => c.name === e.target.value);
                  setSelectedCategoryId(found ? found.id : null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {availableCategories.length === 0 ? (
                  <option value="Umum">Umum</option>
                ) : (
                  availableCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Tanggal & Keperluan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tanggal
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Keterangan / Keperluan
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Makan siang rendang"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/25'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Transaksi</span>
                </>
              )}
            </motion.button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};
