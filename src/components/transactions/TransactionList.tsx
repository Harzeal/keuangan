import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Inbox,
  Calendar,
  Tag,
  Plus
} from 'lucide-react';
import { Transaction, MainCategory, Wallet } from '../../types/database';
import { formatRupiah, formatIndoDate } from '../../lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  wallets?: Wallet[];
  privacyMode: boolean;
  onDeleteTransaction: (id: string) => Promise<{ error: any }>;
  onOpenAddModal: () => void;
  selectedWalletFilter?: string | null;
  onSelectWalletFilter?: (walletName: string | null) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  wallets,
  privacyMode,
  onDeleteTransaction,
  onOpenAddModal,
  selectedWalletFilter,
  onSelectWalletFilter
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>(selectedWalletFilter || 'all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(20);

  React.useEffect(() => {
    setVisibleCount(20);
  }, [search, filterType, walletFilter, sortBy]);

  React.useEffect(() => {
    if (selectedWalletFilter !== undefined) {
      setWalletFilter(selectedWalletFilter || 'all');
    }
  }, [selectedWalletFilter]);

  // Filter & Sort logika
  const filtered = transactions
    .filter((t) => {
      // 1. Search Query
      const query = search.toLowerCase();
      const matchSearch =
        t.title.toLowerCase().includes(query) ||
        t.category_name.toLowerCase().includes(query) ||
        (t.wallet_name && t.wallet_name.toLowerCase().includes(query)) ||
        (t.transfer_from && t.transfer_from.toLowerCase().includes(query)) ||
        (t.transfer_to && t.transfer_to.toLowerCase().includes(query)) ||
        (t.notes && t.notes.toLowerCase().includes(query));

      // 2. Filter Tab
      let matchTab = true;
      if (filterType === 'transfer') matchTab = Boolean(t.is_transfer);
      else if (filterType === 'income') matchTab = t.type === 'income' && !t.is_transfer;
      else if (filterType === 'expense') matchTab = t.type === 'expense' && !t.is_transfer;
      else if (filterType === 'needs') matchTab = t.main_category === 'needs' && !t.is_transfer;
      else if (filterType === 'wants') matchTab = t.main_category === 'wants' && !t.is_transfer;
      else if (filterType === 'savings') matchTab = t.main_category === 'savings' && !t.is_transfer;

      // 3. Wallet Filter
      let matchWallet = true;
      if (walletFilter !== 'all') {
        const wf = walletFilter.toLowerCase();
        if (t.is_transfer) {
          matchWallet =
            (t.transfer_from || '').toLowerCase() === wf ||
            (t.transfer_to || '').toLowerCase() === wf ||
            (t.wallet_name || '').toLowerCase() === wf;
        } else {
          matchWallet = (t.wallet_name || 'Kas / Tunai').toLowerCase() === wf;
        }
      }

      return matchSearch && matchTab && matchWallet;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini?')) {
      setDeletingId(id);
      await onDeleteTransaction(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      
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
          { id: 'transfer', label: '🔄 Pindah Saldo' },
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

      {/* Secondary Controls: Filter Dompet & Urutan */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Sumber Dompet:</span>
          <select
            value={walletFilter}
            onChange={(e) => {
              setWalletFilter(e.target.value);
              if (onSelectWalletFilter) onSelectWalletFilter(e.target.value === 'all' ? null : e.target.value);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Dompet ({transactions.length})</option>
            {wallets?.map((w) => (
              <option key={w.id} value={w.name}>
                {w.type === 'bank' ? '🏦 ' : w.type === 'ewallet' ? '📱 ' : '💵 '}
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Urutan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="date_desc">Tanggal Terbaru</option>
            <option value="date_asc">Tanggal Terlama</option>
            <option value="amount_desc">Nominal Terbesar</option>
            <option value="amount_asc">Nominal Terkecil</option>
          </select>
        </div>
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
        <>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          <AnimatePresence initial={false}>
            {filtered.slice(0, visibleCount).map((tx) => {
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
                        tx.is_transfer
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                          : isIncome
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {tx.is_transfer ? (
                        <ArrowLeftRight className="w-5 h-5" />
                      ) : isIncome ? (
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
                        {tx.is_transfer ? (
                          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                            Pindah Saldo
                          </span>
                        ) : (
                          <span
                            className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${allocationColor}`}
                          >
                            {allocationLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        {tx.is_transfer ? (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 flex items-center gap-1">
                              <span>{tx.transfer_from || tx.wallet_name}</span>
                              <span>➔</span>
                              <span>{tx.transfer_to || 'Tujuan'}</span>
                            </span>
                            <span>•</span>
                            <span>{formatIndoDate(tx.date)}</span>
                          </>
                        ) : (
                          <>
                            {tx.is_from_savings && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                🛡️ Dari Tabungan
                              </span>
                            )}
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {tx.category_name}
                            </span>
                            <span>•</span>
                            <span>{formatIndoDate(tx.date)}</span>
                            {tx.wallet_name && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                  {tx.wallet_name}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Nominal & Delete Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-xs sm:text-sm font-black tracking-tight ${
                          tx.is_transfer
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {privacyMode ? (
                          '••••••'
                        ) : tx.is_transfer ? (
                          `⇄ ${formatRupiah(tx.amount)}`
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

        {/* Tombol Muat Lebih Banyak jika data banyak */}
        {filtered.length > visibleCount && (
          <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-xs"
            >
              Tampilkan Lebih Banyak ({filtered.length - visibleCount} catatan lagi)
            </button>
          </div>
        )}
      </>
    )}

    </div>
  );
};
