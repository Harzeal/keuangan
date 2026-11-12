import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Landmark,
  Smartphone,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PiggyBank,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  ShoppingBag,
  Pencil
} from 'lucide-react';
import {
  MonthSummary,
  Wallet,
  Transaction,
  SmartRecommendation,
  BudgetSettings
} from '../../types/database';
import { formatRupiah, formatMonthYear, formatIndoDate, getCurrentMonthYear } from '../../lib/utils';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { CategorySpendingBreakdown } from './CategorySpendingBreakdown';

export type NavTabId =
  | 'dashboard'
  | 'transactions'
  | 'categories'
  | 'wallets'
  | 'budgets'
  | 'recurring'
  | 'settings';

interface BentoDashboardV24Props {
  userDisplayName: string;
  selectedMonthYear: string;
  onMonthChange: (m: string) => void;
  summary: MonthSummary;
  budgetSettings: BudgetSettings;
  wallets: (Wallet & {
    current_balance: number;
    total_in: number;
    total_out: number;
    transaction_count: number;
  })[];
  transactions: Transaction[];
  monthlyComparison: { month: string; income: number; expense: number; savings: number }[];
  recommendations: SmartRecommendation[];
  privacyMode: boolean;
  onOpenAddModal: (initialType?: 'income' | 'expense' | 'transfer', fromSavings?: boolean) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onNavigateTab: (tab: NavTabId) => void;
  selectedWalletFilter: string | null;
  onSelectWalletFilter: (walletName: string | null) => void;
}

export const BentoDashboardV24: React.FC<BentoDashboardV24Props> = ({
  userDisplayName,
  selectedMonthYear,
  onMonthChange,
  summary,
  budgetSettings,
  wallets,
  transactions,
  monthlyComparison,
  recommendations,
  privacyMode,
  onOpenAddModal,
  onEditTransaction,
  onNavigateTab,
  selectedWalletFilter,
  onSelectWalletFilter
}) => {
  const [feedFilter, setFeedFilter] = useState<'all' | 'income' | 'expense'>('all');

  const handlePrevMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const d = new Date(year, month, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const operationalBudget =
    summary.monthly_operational_budget || summary.budget_needs + summary.budget_wants;
  const operationalSpent = summary.monthly_operational_spent || summary.total_expense;
  const operationalUsedPercent =
    operationalBudget > 0
      ? Math.min(100, Math.round((operationalSpent / operationalBudget) * 100))
      : 0;
  const budgetHealthPercent = Math.max(0, 100 - operationalUsedPercent);

  const dailyUsedPercent =
    summary.daily_limit > 0
      ? Math.min(100, Math.round((summary.spent_today / summary.daily_limit) * 100))
      : 0;

  const incomeTxList = useMemo(
    () => transactions.filter((t) => t.type === 'income' && !t.is_transfer),
    [transactions]
  );
  const expenseTxList = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && !t.is_transfer),
    [transactions]
  );

  const totalFlow = summary.income + summary.total_expense;
  const incomeRatioTicks =
    totalFlow > 0 ? Math.round((summary.income / totalFlow) * 24) : 12;

  const capsuleBars = useMemo(() => {
    const list = monthlyComparison.slice(-5);
    const maxVal = Math.max(
      1,
      ...list.map((m) => Math.max(m.income || 0, m.expense || 0, 1))
    );
    return list.map((item) => ({
      label: formatMonthYear(item.month).slice(0, 3),
      isCurrent: item.month === selectedMonthYear,
      incomePct: Math.max(14, Math.round(((item.income || 0) / maxVal) * 100)),
      expensePct: Math.max(14, Math.round(((item.expense || 0) / maxVal) * 100))
    }));
  }, [monthlyComparison, selectedMonthYear]);

  const weekDays = useMemo(() => {
    const today = new Date();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 3 + i);
      const isToday = i === 3;
      return {
        dayName: dayNames[d.getDay()],
        dateNum: d.getDate(),
        isToday
      };
    });
  }, []);

  const recentFeed = useMemo(() => {
    return transactions
      .filter((t) => {
        if (feedFilter === 'income') return t.type === 'income' && !t.is_transfer;
        if (feedFilter === 'expense') return t.type === 'expense' && !t.is_transfer;
        return true;
      })
      .slice(0, 6);
  }, [transactions, feedFilter]);

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'ewallet':
        return <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'cash':
        return <WalletIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-6 items-start">
      {/* =====================================================================
          CENTER MAIN CONTENT AREA (~70% width -> 8 cols on xl)
         ===================================================================== */}
      <div className="xl:col-span-8 space-y-3.5 sm:space-y-5 lg:space-y-6">
        {/* 1. TOP HERO BANNER */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#113932] via-slate-900 to-indigo-950 text-white p-4 sm:p-6 lg:p-7 shadow-lg border border-white/10"
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute right-20 -bottom-16 w-40 h-40 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Dashboard V24 • {formatMonthYear(selectedMonthYear)}</span>
              </div>

              <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Halo, {userDisplayName} 👋
              </h1>

              <p className="text-[11px] sm:text-sm text-slate-300 leading-relaxed">
                Sisa uang belanja bulan ini{' '}
                <b className="text-emerald-300 tabular-nums">
                  {privacyMode
                    ? 'Rp ••••••••'
                    : formatRupiah(summary.monthly_operational_remaining)}
                </b>{' '}
                dengan batas aman harian{' '}
                <b className="text-white tabular-nums">
                  {privacyMode ? 'Rp •••' : formatRupiah(summary.daily_limit)}/hari
                </b>{' '}
                ({summary.days_left_in_month} hari tersisa).
              </p>

              {/* Hero KPI Mini Pills */}
              <div className="pt-1.5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
                <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-slate-300 block truncate">
                    Total Kas
                  </span>
                  <span className="text-xs sm:text-base font-extrabold text-white tabular-nums block truncate">
                    {privacyMode ? 'Rp ••••' : formatRupiah(summary.lifetime_total_balance)}
                  </span>
                </div>

                <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-emerald-500/15 backdrop-blur-xs border border-emerald-400/20 min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-emerald-200 block truncate">
                    Tabungan
                  </span>
                  <span className="text-xs sm:text-base font-extrabold text-emerald-300 tabular-nums block truncate">
                    {privacyMode ? 'Rp ••••' : formatRupiah(summary.total_savings_accumulated)}
                  </span>
                </div>

                <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-slate-300 block truncate">
                    Limit Hari Ini
                  </span>
                  <span
                    className={`text-xs sm:text-base font-extrabold tabular-nums block truncate ${
                      summary.remaining_today < 0 ? 'text-rose-300' : 'text-white'
                    }`}
                  >
                    {privacyMode ? 'Rp ••••' : formatRupiah(summary.remaining_today)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Wallet Avatars + Warm Orange CTA Pill */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2.5 sm:gap-4 shrink-0">
              {/* Quick Wallet Avatars */}
              <div
                onClick={() => onNavigateTab('wallets')}
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group bg-white/10 hover:bg-white/15 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-white/10 transition"
                title="Klik untuk kelola Dompet & Rekening"
              >
                <div className="flex -space-x-1.5 sm:-space-x-2">
                  {wallets.slice(0, 4).map((w) => (
                    <div
                      key={w.id}
                      className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-[9px] sm:text-xs font-bold ring-2 ring-slate-900 shadow-xs"
                      style={{ backgroundColor: w.color || '#10b981' }}
                    >
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-200 group-hover:text-white">
                  {wallets.length} Dompet
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onOpenAddModal('transfer', false)}
                  className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] sm:text-xs font-bold border border-white/15 flex items-center gap-1 transition"
                >
                  <ArrowLeftRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline">Transfer</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onOpenAddModal('expense', false)}
                  className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#F97316] hover:bg-orange-600 text-white text-[11px] sm:text-sm font-extrabold shadow-lg shadow-orange-500/30 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  <span>Catat</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. MIDDLE BENTO ROW (3 COLUMNS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
          {/* Card 1: Wallets / Quick Transfer */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Dompet & Transfer
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    Pilih untuk filter atau pindah saldo
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('wallets')}
                  className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Kelola
                </button>
              </div>

              {/* Horizontal row of circular wallet icons */}
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 scrollbar-none">
                {wallets.map((w) => {
                  const isSelected = selectedWalletFilter === w.name;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onSelectWalletFilter(isSelected ? null : w.name)}
                      className="flex flex-col items-center gap-1 shrink-0 group"
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 ${
                          isSelected ? 'ring-2 ring-offset-2 ring-emerald-500' : ''
                        }`}
                        style={{ backgroundColor: w.color || '#10b981' }}
                      >
                        {getWalletIcon(w.type)}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-200 max-w-[60px] truncate">
                        {w.name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 tabular-nums">
                        {privacyMode
                          ? '••••'
                          : `${((w.current_balance || 0) / 1000).toFixed(0)}k`}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => onOpenAddModal('transfer', false)}
                  className="flex flex-col items-center gap-1 shrink-0 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:border-emerald-500 group-hover:text-emerald-500 transition">
                    <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Transfer
                  </span>
                  <span className="text-[9px] text-transparent">.</span>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Total Saldo Kas</span>
              <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                {privacyMode ? 'Rp ••••••••' : formatRupiah(summary.lifetime_total_balance)}
              </span>
            </div>
          </motion.div>

          {/* Card 2: Monthly Cashflow / Net Savings + Vertical Capsule Chart */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                  Sisa Uang Bulan Ini
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Tabung {summary.savings_rate_percent.toFixed(0)}%
                </span>
              </div>

              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {privacyMode ? (
                  'Rp ••••••••'
                ) : (
                  <AnimatedCounter value={summary.monthly_operational_remaining} />
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                Dari pagu belanja {privacyMode ? '•••' : formatRupiah(operationalBudget)}
              </p>
            </div>

            <div className="mt-3 pt-1 flex items-end justify-between gap-1.5 h-20 sm:h-24">
              {capsuleBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-14 sm:h-16">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.incomePct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                      className={`w-2 sm:w-2.5 rounded-full ${
                        bar.isCurrent
                          ? 'bg-[#10B981]'
                          : 'bg-emerald-200 dark:bg-emerald-900/60'
                      }`}
                      title={`Masuk ${bar.label}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.expensePct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05 + 0.1 }}
                      className={`w-2 sm:w-2.5 rounded-full ${
                        bar.isCurrent
                          ? 'bg-[#113932] dark:bg-indigo-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      title={`Keluar ${bar.label}`}
                    />
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold ${
                      bar.isCurrent
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Budget Health / Target Ratio Capsule Indicator */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Kesehatan Anggaran
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  Komposisi 50/20/30 & Limit
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('budgets')}
                className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Atur
              </button>
            </div>

            <div className="my-2.5 flex items-center gap-3.5">
              <div className="w-12 h-22 sm:w-14 sm:h-26 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 flex flex-col justify-end overflow-hidden shrink-0">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${budgetHealthPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="w-full rounded-xl bg-gradient-to-t from-[#113932] via-emerald-600 to-emerald-400 flex items-center justify-center text-white font-extrabold text-[10px] sm:text-xs shadow-xs"
                >
                  {budgetHealthPercent}%
                </motion.div>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase">
                    Sisa Kuota Belanja
                  </span>
                  <p className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {budgetHealthPercent}% Aman
                  </p>
                </div>

                <div className="space-y-0.5 text-[10px] sm:text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Terpakai Bln Ini:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {operationalUsedPercent}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kuota Hari Ini:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {dailyUsedPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
              <span>Alokasi: {budgetSettings.needs_percentage}/{budgetSettings.wants_percentage}/{budgetSettings.savings_percentage}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {summary.days_left_in_month} Hari Lagi
              </span>
            </div>
          </motion.div>
        </div>

        {/* 3. BOTTOM BENTO ROW (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
          {/* Left Card (5 cols): Financial Statistics */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Statistik Finansial
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Pemasukan vs Pengeluaran Bulan Ini
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('categories')}
                  className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Grafik
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3.5">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block">
                    Total Pemasukan
                  </span>
                  <span className="text-sm sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {privacyMode ? 'Rp ••••••' : formatRupiah(summary.income)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block">
                    Total Pengeluaran
                  </span>
                  <span className="text-sm sm:text-lg font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                    {privacyMode ? 'Rp ••••••' : formatRupiah(summary.total_expense)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 mb-1">
                  <span>RASIO ARUS KAS</span>
                  <span>
                    {summary.income > 0
                      ? `${Math.round((summary.total_expense / summary.income) * 100)}% Terpakai`
                      : '0%'}
                  </span>
                </div>
                <div className="grid grid-cols-24 gap-0.5 sm:gap-1 h-4 sm:h-5 items-center">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const isFilled = i < incomeRatioTicks;
                    return (
                      <div
                        key={i}
                        className={`h-full rounded-full transition-colors ${
                          isFilled
                            ? 'bg-[#10B981]'
                            : 'bg-orange-400/80 dark:bg-orange-500/60'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Transaksi Masuk
                  </p>
                  <p className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {incomeTxList.length} Kali
                  </p>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Transaksi Keluar
                  </p>
                  <p className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {expenseTxList.length} Kali
                  </p>
                </div>
              </div>
            </div>

            {recommendations[0] && (
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block">
                    Smart Insight
                  </span>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {recommendations[0].title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('categories')}
                  className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-[11px] font-bold shrink-0 hover:bg-emerald-100 transition"
                >
                  Detail
                </button>
              </div>
            )}
          </motion.div>

          {/* Right Card (7 cols): Persentase & Total Uang Bulan Ini Habis di Kategori Mana Saja */}
          <div className="lg:col-span-7">
            <CategorySpendingBreakdown
              transactions={transactions}
              summary={summary}
              privacyMode={privacyMode}
              compact={true}
              onViewAllCategories={() => onNavigateTab('categories')}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          RIGHT SIDEBAR PANEL (~30% width -> 4 cols on xl)
         ===================================================================== */}
      <div className="xl:col-span-4 space-y-3.5 sm:space-y-5 lg:space-y-6">
        {/* 1. TOP CALENDAR STRIP */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#113932] dark:text-emerald-400" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {formatMonthYear(selectedMonthYear)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              {selectedMonthYear !== getCurrentMonthYear() && (
                <button
                  onClick={() => onMonthChange(getCurrentMonthYear())}
                  className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold"
                >
                  Hari Ini
                </button>
              )}
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {weekDays.map((d, idx) => (
              <div
                key={idx}
                className={`py-2 px-0.5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${
                  d.isToday
                    ? 'bg-[#113932] text-white shadow-md shadow-[#113932]/25 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span
                  className={`text-[9px] sm:text-[10px] ${
                    d.isToday ? 'text-emerald-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  {d.dayName}
                </span>
                <span className="text-[11px] sm:text-sm font-extrabold tabular-nums">
                  {d.dateNum}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 2. MIDDLE SECTION: SAVINGS GOALS / INVESTMENT POTS & POS ALOKASI */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5 sm:space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Brankas & Pos Anggaran
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Progress tabungan & batas pos bulan ini
              </p>
            </div>
            <button
              onClick={() => onOpenAddModal('expense', true)}
              className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-[11px] font-bold hover:bg-emerald-100 transition"
            >
              + Pakai Tabungan
            </button>
          </div>

          <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#113932] to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                  Brankas Tabungan
                </p>
                <span className="text-[11px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {privacyMode ? 'Rp ••••••' : formatRupiah(summary.total_savings_accumulated)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(20, summary.savings_rate_percent * 2))}%` }}
                />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">
                Target bulan ini: {privacyMode ? '•••' : formatRupiah(summary.budget_savings)}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                  Pos Kebutuhan ({budgetSettings.needs_percentage}%)
                </p>
                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
                  {privacyMode ? 'Rp ••••••' : formatRupiah(summary.needs_expense)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{
                    width: `${
                      summary.budget_needs > 0
                        ? Math.min(100, (summary.needs_expense / summary.budget_needs) * 100)
                        : 0
                    }%`
                  }}
                />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">
                Sisa pagu: {privacyMode ? '•••' : formatRupiah(summary.remaining_needs_budget)}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                  Pos Keinginan ({budgetSettings.wants_percentage}%)
                </p>
                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
                  {privacyMode ? 'Rp ••••••' : formatRupiah(summary.wants_expense)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: `${
                      summary.budget_wants > 0
                        ? Math.min(100, (summary.wants_expense / summary.budget_wants) * 100)
                        : 0
                    }%`
                  }}
                />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">
                Sisa pagu: {privacyMode ? '•••' : formatRupiah(summary.remaining_wants_budget)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3. BOTTOM SECTION: RECENT TRANSACTIONS FEED */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Aktivitas Terbaru
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Transaksi terakhir bulan ini
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Semua ({transactions.length})
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3 text-[11px] sm:text-xs font-bold">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'income', label: 'Masuk' },
              { id: 'expense', label: 'Keluar' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeedFilter(tab.id as any)}
                className={`py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition ${
                  feedFilter === tab.id
                    ? 'bg-[#113932] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {recentFeed.length === 0 ? (
            <div className="py-6 text-center text-slate-400">
              <p className="text-xs font-semibold">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentFeed.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2.5 py-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${
                          tx.is_transfer
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                            : isIncome
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                        }`}
                      >
                        {tx.is_transfer ? (
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        ) : isIncome ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tx.title}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                          {tx.category_name} • {formatIndoDate(tx.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[11px] sm:text-xs font-extrabold tabular-nums ${
                          tx.is_transfer
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {privacyMode
                          ? '••••••'
                          : `${tx.is_transfer ? '⇄' : isIncome ? '+' : '-'}${formatRupiah(tx.amount)}`}
                      </span>
                      {onEditTransaction && (
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Transaksi"
                        >
                          <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('transactions')}
            className="mt-3.5 w-full py-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 transition"
          >
            Buka Seluruh Riwayat Transaksi
          </button>
        </motion.div>
      </div>
    </div>
  );
};
