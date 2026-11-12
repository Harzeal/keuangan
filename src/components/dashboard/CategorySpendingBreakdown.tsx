import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Wallet,
  ChevronDown,
  ChevronUp,
  Layers,
  Pencil
} from 'lucide-react';
import { Transaction, MonthSummary } from '../../types/database';
import { formatRupiah, formatIndoDate } from '../../lib/utils';

interface CategorySpendingBreakdownProps {
  transactions: Transaction[];
  summary: MonthSummary;
  privacyMode: boolean;
  compact?: boolean;
  onViewAllCategories?: () => void;
  onOpenCategoryManager?: () => void;
}

const CATEGORY_COLORS = [
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#0ea5e9', // Sky
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#84cc16'  // Lime
];

export const CategorySpendingBreakdown: React.FC<CategorySpendingBreakdownProps> = ({
  transactions,
  summary,
  privacyMode,
  compact = false,
  onViewAllCategories,
  onOpenCategoryManager
}) => {
  const [basisMode, setBasisMode] = useState<'monthly_money' | 'total_expense'>('monthly_money');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [filterAllocation, setFilterAllocation] = useState<'all' | 'needs' | 'wants' | 'savings'>('all');

  const expenseTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense' && !t.is_transfer);
  }, [transactions]);

  const grandTotalSpent = useMemo(() => {
    return expenseTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [expenseTransactions]);

  const totalMonthlyMoney = summary.income > 0 ? summary.income : grandTotalSpent;
  const remainingMonthlyMoney = Math.max(0, totalMonthlyMoney - grandTotalSpent);
  const spentOfMonthlyPercent = totalMonthlyMoney > 0 ? Math.min(100, (grandTotalSpent / totalMonthlyMoney) * 100) : 0;
  const remainingOfMonthlyPercent = Math.max(0, 100 - spentOfMonthlyPercent);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        amount: number;
        count: number;
        main_category: string;
        items: Transaction[];
      }
    >();

    expenseTransactions.forEach((tx) => {
      if (filterAllocation !== 'all' && tx.main_category !== filterAllocation) return;

      const key = tx.category_name || 'Lainnya';
      const existing = map.get(key);
      if (existing) {
        existing.amount += Number(tx.amount || 0);
        existing.count += 1;
        existing.items.push(tx);
      } else {
        map.set(key, {
          name: key,
          amount: Number(tx.amount || 0),
          count: 1,
          main_category: tx.main_category || 'needs',
          items: [tx]
        });
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount);

    return list.map((item, idx) => {
      const pctOfMonthlyMoney = totalMonthlyMoney > 0 ? (item.amount / totalMonthlyMoney) * 100 : 0;
      const pctOfTotalExpense = grandTotalSpent > 0 ? (item.amount / grandTotalSpent) * 100 : 0;
      return {
        ...item,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        pctOfMonthlyMoney,
        pctOfTotalExpense
      };
    });
  }, [expenseTransactions, filterAllocation, totalMonthlyMoney, grandTotalSpent]);

  const displayedCategories = compact ? categoryBreakdown.slice(0, 4) : categoryBreakdown;

  const getMainCategoryBadge = (mainCat: string) => {
    switch (mainCat) {
      case 'needs':
        return {
          label: 'Kebutuhan',
          cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
        };
      case 'wants':
        return {
          label: 'Keinginan',
          cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        };
      case 'savings':
        return {
          label: 'Tabungan',
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
        };
      default:
        return {
          label: 'Pengeluaran',
          cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        };
    }
  };

  return (
    <motion.div
      whileHover={compact ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                  {compact ? 'Kemana Uang Bulan Ini Habis?' : 'Rincian Uang Bulan Ini per Kategori'}
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                  {categoryBreakdown.length} Kategori
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                Persentase & nominal uang bulan ini yang habis di setiap kategori
              </p>
            </div>
          </div>

          {!compact && (
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit / Hapus Kategori</span>
                </button>
              )}

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] sm:text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBasisMode('monthly_money')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    basisMode === 'monthly_money'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  % dr Uang Bln Ini
                </button>
                <button
                  type="button"
                  onClick={() => setBasisMode('total_expense')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    basisMode === 'total_expense'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  % dr Total Keluar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Banner: Compact 3-cols on all screens including HP */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3.5 sm:mb-5">
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 min-w-0">
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="truncate">Uang Bln Ini</span>
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-500 shrink-0 hidden xs:block" />
            </div>
            <p className="text-xs sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5 truncate">
              {privacyMode ? 'Rp ••••' : formatRupiah(totalMonthlyMoney)}
            </p>
            <span className="text-[8.5px] sm:text-[10px] text-slate-400 block truncate">
              {summary.income > 0 ? '100% Dana' : 'Total Transaksi'}
            </span>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 min-w-0">
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-orange-700 dark:text-orange-300 font-medium gap-1">
              <span className="truncate">Habis</span>
              <span className="text-[8.5px] sm:text-[10px] font-extrabold px-1 py-0.2 rounded bg-orange-500/15 text-orange-700 dark:text-orange-300 shrink-0">
                {spentOfMonthlyPercent.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs sm:text-base lg:text-lg font-extrabold text-orange-600 dark:text-orange-400 tabular-nums mt-0.5 truncate">
              {privacyMode ? 'Rp ••••' : formatRupiah(grandTotalSpent)}
            </p>
            <span className="text-[8.5px] sm:text-[10px] text-orange-600/80 dark:text-orange-400/80 block truncate">
              {expenseTransactions.length} transaksi
            </span>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 min-w-0">
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 font-medium gap-1">
              <span className="truncate">Sisa</span>
              <span className="text-[8.5px] sm:text-[10px] font-extrabold px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                {remainingOfMonthlyPercent.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs sm:text-base lg:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 truncate">
              {privacyMode ? 'Rp ••••' : formatRupiah(remainingMonthlyMoney)}
            </p>
            <span className="text-[8.5px] sm:text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block truncate">
              Belum terpakai
            </span>
          </div>
        </div>

        {/* Multi-Segment Stacked Bar */}
        {categoryBreakdown.length > 0 && (
          <div className="mb-3.5 sm:mb-5">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Peta Serapan Uang Bulan Ini</span>
              <span className="tabular-nums">
                Habis {spentOfMonthlyPercent.toFixed(1)}% • Sisa {remainingOfMonthlyPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 sm:h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              {categoryBreakdown.map((cat) => {
                const widthPct =
                  basisMode === 'monthly_money' ? cat.pctOfMonthlyMoney : cat.pctOfTotalExpense;
                if (widthPct <= 0.3) return null;
                return (
                  <motion.div
                    key={cat.name}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, widthPct)}%` }}
                    transition={{ duration: 0.6 }}
                    style={{ backgroundColor: cat.color }}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    title={`${cat.name}: ${formatRupiah(cat.amount)} (${widthPct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Alokasi (Hanya di mode penuh) */}
        {!compact && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none text-[11px] sm:text-xs font-semibold">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'needs', label: 'Kebutuhan (Needs)' },
              { id: 'wants', label: 'Keinginan (Wants)' },
              { id: 'savings', label: 'Tabungan & Investasi' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterAllocation(tab.id as any)}
                className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition ${
                  filterAllocation === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Daftar Kategori & Persentase */}
        {displayedCategories.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Layers className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Belum ada pengeluaran di bulan ini
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedCategories.map((cat, idx) => {
              const badge = getMainCategoryBadge(cat.main_category);
              const isExpanded = expandedCategory === cat.name;
              const primaryPct =
                basisMode === 'monthly_money' ? cat.pctOfMonthlyMoney : cat.pctOfTotalExpense;

              return (
                <div
                  key={cat.name}
                  className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div
                    onClick={() => !compact && setExpandedCategory(isExpanded ? null : cat.name)}
                    className={!compact ? 'cursor-pointer' : ''}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-extrabold text-[10px] sm:text-xs shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        >
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {cat.name}
                            </h4>
                            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                            {cat.count} transaksi
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {privacyMode ? 'Rp ••••••' : formatRupiah(cat.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[9.5px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {cat.pctOfMonthlyMoney.toFixed(1)}% bln ini
                          </span>
                          <span className="text-[9px] text-slate-400">•</span>
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                            {cat.pctOfTotalExpense.toFixed(0)}% keluar
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 sm:h-2 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, primaryPct)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{ backgroundColor: cat.color }}
                          className="h-full rounded-full"
                        />
                      </div>
                      {!compact && (
                        <span className="text-slate-400">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {!compact && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Daftar Transaksi {cat.name}:
                          </p>
                          {cat.items.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between text-[11px] sm:text-xs py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {t.title}
                                </p>
                                <p className="text-[9.5px] sm:text-[10px] text-slate-400">
                                  {formatIndoDate(t.date)} • {t.wallet_name || 'Kas / Tunai'}
                                </p>
                              </div>
                              <span className="font-extrabold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                                {privacyMode ? '••••••' : formatRupiah(t.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA for compact mode */}
      {compact && onViewAllCategories && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            {categoryBreakdown.length > 4
              ? `+${categoryBreakdown.length - 4} kategori lainnya`
              : 'Klik untuk rincian penuh'}
          </span>
          <button
            type="button"
            onClick={onViewAllCategories}
            className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] sm:text-xs font-bold shadow-sm shadow-emerald-500/20 transition"
          >
            Lihat Detail Kategori
          </button>
        </div>
      )}
    </motion.div>
  );
};
