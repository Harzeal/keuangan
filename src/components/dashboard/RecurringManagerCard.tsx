import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Repeat,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';
import { RecurringTransaction, Category, Wallet, MainCategory } from '../../types/database';
import { formatRupiah, parseRupiahInput } from '../../lib/utils';

interface RecurringManagerCardProps {
  recurringList: RecurringTransaction[];
  wallets: Wallet[];
  categories: Category[];
  selectedMonthYear: string;
  privacyMode: boolean;
  onAddRecurring: (item: Omit<RecurringTransaction, 'id'>) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (id: string) => void;
  onProcessRecurring: (id: string) => Promise<any>;
}

export const RecurringManagerCard: React.FC<RecurringManagerCardProps> = ({
  recurringList,
  wallets,
  categories,
  selectedMonthYear,
  privacyMode,
  onAddRecurring,
  onDeleteRecurring,
  onToggleRecurring,
  onProcessRecurring
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('needs');
  const [categoryName, setCategoryName] = useState('');
  const [walletName, setWalletName] = useState('Kas / Tunai');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const availableCategories = categories.filter((c) => c.main_category === mainCategory);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseRupiahInput(amountStr);
    if (!title.trim() || amountNum <= 0) return;

    const cat = categoryName || (availableCategories[0]?.name ?? 'Tagihan Bulanan');

    onAddRecurring({
      title: title.trim(),
      amount: amountNum,
      type: 'expense',
      main_category: mainCategory,
      category_name: cat,
      wallet_name: walletName || wallets[0]?.name || 'Kas / Tunai',
      frequency: 'monthly',
      day_of_month: Number(dayOfMonth),
      is_active: true,
      last_processed_month: null
    });

    setTitle('');
    setAmountStr('');
    setIsModalOpen(false);
  };

  const handleExecute = async (id: string) => {
    setProcessingId(id);
    await onProcessRecurring(id);
    setProcessingId(null);
  };

  const totalMonthlyCommitment = recurringList
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-indigo-500" />
              <span>Tagihan & Pengeluaran Rutin</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {recurringList.length} Jadwal
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Otomasi pencatatan komitmen bulanan (WiFi, Kosan, Cicilan, Langganan)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block font-medium">Total Komitmen / Bulan</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {privacyMode ? '••••••••' : formatRupiah(totalMonthlyCommitment)}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rutin</span>
          </motion.button>
        </div>
      </div>

      {/* List Tagihan Rutin */}
      {recurringList.length === 0 ? (
        <div className="py-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Belum ada tagihan rutin yang didaftarkan.
          </p>
          <p className="text-[11px] text-slate-400">
            Daftarkan pengeluaran berulang bulanan Anda agar bisa dicatat otomatis dengan 1 klik!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recurringList.map((item) => {
            const isProcessedThisMonth = item.last_processed_month === selectedMonthYear;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -1 }}
                className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isProcessedThisMonth
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isProcessedThisMonth
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {privacyMode ? '••••••••' : formatRupiah(item.amount)}
                      </span>
                      <span>•</span>
                      <span>Tiap tgl {item.day_of_month}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-[10px]">
                        {item.wallet_name || 'Tunai'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isProcessedThisMonth ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tercatat</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleExecute(item.id)}
                      disabled={processingId === item.id}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1 transition"
                    >
                      {processingId === item.id ? 'Memproses...' : 'Catat Sekarang'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Hapus pengeluaran rutin '${item.title}'?`)) {
                        onDeleteRecurring(item.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Tagihan Rutin */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Tambah Tagihan Rutin Bulanan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Simpan pos pengeluaran berulang agar dapat dicatat setiap bulan secara instan
              </p>

              <form onSubmit={handleCreate} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Tagihan / Pengeluaran
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: WiFi Indihome, Kosan, Netflix"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nominal (Rp)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rp 0"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Jatuh Tempo (Tgl 1-28)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Math.max(1, Math.min(28, parseInt(e.target.value) || 1)))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Alokasi Pos
                    </label>
                    <select
                      value={mainCategory}
                      onChange={(e) => setMainCategory(e.target.value as MainCategory)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="needs">Kebutuhan (Needs)</option>
                      <option value="wants">Keinginan (Wants)</option>
                      <option value="savings">Tabungan / Investasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Dompet Sumber Dana
                    </label>
                    <select
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition"
                  >
                    Simpan Rutin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
