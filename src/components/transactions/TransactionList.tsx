import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Inbox,
  Calendar,
  Tag,
  Plus
} from 'lucide-react';
import { Transaction, MainCategory } from '../../types/database';
import { formatRupiah, formatIndoDate } from '../../lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  privacyMode: boolean;
  onDeleteTransaction: (id: string) => Promise<{ error: any }>;
  onOpenAddModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  privacyMode,
  onDeleteTransaction,
  onOpenAddModal
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter logika
  const filtered = transactions.filter((t) => {
    // 1. Search Query
    const query = search.toLowerCase();
    const matchSearch =
      t.title.toLowerCase().includes(query) ||
      t.category_name.toLowerCase().includes(query) ||
      (t.notes && t.notes.toLowerCase().includes(query));

    // 2. Filter Tab
    let matchTab = true;
    if (filterType === 'income') matchTab = t.type === 'income';
    else if (filterType === 'expense') matchTab = t.type === 'expense';
    else if (filterType === 'needs') matchTab = t.main_category === 'needs';
    else if (filterType === 'wants') matchTab = t.main_category === 'wants';
    else if (filterType === 'savings') matchTab = t.main_category === 'savings';

    return matchSearch && matchTab;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini?')) {
      setDeletingId(id);
      await onDeleteTransaction(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Riwayat Transaksi</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {transactions.length} catatan
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar seluruh uang masuk dan keluar pada bulan yang dipilih
          </p>
        </div>

        {/* Search & Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi / keperluan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </motion.button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'income', label: '🟢 Pemasukan' },
          { id: 'needs', label: '🔵 Kebutuhan' },
          { id: 'wants', label: '🟠 Keinginan' },
          { id: 'savings', label: '🟣 Tabungan' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              filterType === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Items */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tidak ada transaksi ditemukan
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Mulai catat pemasukan dan pengeluaran bulan ini.'}
            </p>
          </div>
          {!search && (
            <button
              onClick={onOpenAddModal}
              className="mt-2 px-4 py-2 bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 rounded-xl text-xs font-bold hover:bg-brand-100 transition"
            >
              + Catat Transaksi Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          <AnimatePresence initial={false}>
            {filtered.map((tx) => {
              const isIncome = tx.type === 'income';
              const allocationColor =
                tx.main_category === 'needs'
                  ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                  : tx.main_category === 'wants'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  : tx.main_category === 'savings'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800';

              const allocationLabel =
                tx.main_category === 'needs'
                  ? 'Kebutuhan'
                  : tx.main_category === 'wants'
                  ? 'Keinginan'
                  : tx.main_category === 'savings'
                  ? 'Tabungan'
                  : 'Pemasukan';

              return (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-2xl transition"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {tx.title}
                        </p>
                        <span
                          className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${allocationColor}`}
                        >
                          {allocationLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {tx.category_name}
                        </span>
                        <span>•</span>
                        <span>{formatIndoDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Nominal & Delete Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-xs sm:text-sm font-black tracking-tight ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {privacyMode ? (
                          '••••••'
                        ) : (
                          `${isIncome ? '+' : '-'} ${formatRupiah(tx.amount)}`
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
};
