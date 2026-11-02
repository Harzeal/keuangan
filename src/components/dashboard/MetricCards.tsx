import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  PiggyBank,
  Layers,
  Flame,
  ArrowUpRight,
  TrendingDown,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';
import { MonthSummary } from '../../types/database';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { SmartAlertBadge } from '../common/SmartAlertBadge';
import { formatRupiah } from '../../lib/utils';

interface MetricCardsProps {
  summary: MonthSummary;
  privacyMode: boolean;
  walletsCount?: number;
  onOpenWithdrawSavings?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  privacyMode,
  walletsCount = 1,
  onOpenWithdrawSavings
}) => {
  // Hitung persentase penggunaan anggaran belanja bulanan (Kebutuhan + Keinginan)
  const operationalBudget = summary.monthly_operational_budget || (summary.budget_needs + summary.budget_wants);
  const operationalSpent = summary.monthly_operational_spent || summary.total_expense;
  const operationalUsedPercent = operationalBudget > 0 ? Math.min(100, Math.round((operationalSpent / operationalBudget) * 100)) : 0;

  // Hitung persentase penggunaan limit harian
  const dailyUsedPercent = summary.daily_limit > 0 ? Math.min(100, Math.round((summary.spent_today / summary.daily_limit) * 100)) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' }
    })
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      
      {/* 1. TOTAL UANG BULAN INI (DANA BELANJA OPERASIONAL DIPISAH DARI TABUNGAN) */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all relative overflow-hidden group ${
          summary.alert_level_monthly === 'danger'
            ? 'border-rose-400 dark:border-rose-700/80 ring-1 ring-rose-400'
            : 'border-slate-200/80 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <SmartAlertBadge status={summary.alert_level_monthly} size="sm" />
        </div>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total Uang Bulan Ini (Uang Belanja)
        </p>

        <div className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${
          summary.monthly_operational_remaining < 0
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-900 dark:text-white'
        }`}>
          {privacyMode ? (
            <span className="tracking-widest">Rp ••••••••</span>
          ) : (
            <AnimatedCounter value={summary.monthly_operational_remaining} />
          )}
        </div>

        {/* Progress Bar Anggaran Belanja Bulanan */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Terpakai {operationalUsedPercent}%</span>
            <span>Pagu: {privacyMode ? '•••' : (operationalBudget / 1000000).toFixed(1) + 'Jt'}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${operationalUsedPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                operationalUsedPercent > 100
                  ? 'bg-rose-500'
                  : operationalUsedPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-brand-500'
              }`}
            />
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
          <span className="truncate">Pos Kebutuhan & Keinginan</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold shrink-0">
            Terpisah dr Tabungan
          </span>
        </div>
      </motion.div>

      {/* 2. TOTAL TABUNGAN (DIPISAHKAN DARI UANG BULANAN & BERTAMBAH DARI SURPLUS AKHIR BULAN) */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-200/80 dark:border-emerald-950/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>

          {onOpenWithdrawSavings && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenWithdrawSavings}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition shadow-2xs"
              title="Gunakan atau tarik dana dari brankas tabungan"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Pakai Tabungan</span>
            </motion.button>
          )}
        </div>

        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Total Tabungan (Brankas Aman)
        </p>

        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {privacyMode ? (
            <span className="tracking-widest">Rp ••••••••</span>
          ) : (
            <AnimatedCounter value={summary.total_savings_accumulated} />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Target: {privacyMode ? '•••' : formatRupiah(summary.budget_savings)}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
            Tersimpan
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
          <span className="truncate text-[10.5px]">Sisa akhir bulan otomatis masuk</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
            Akumulatif
          </span>
        </div>
      </motion.div>

      {/* 3. TOTAL SEMUA KAS (KAS NYATA DARI SELURUH DOMPET & REKENING) */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            {walletsCount} Dompet
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total Semua Kas (Semua Dompet)
        </p>

        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {privacyMode ? (
            <span className="tracking-widest">Rp ••••••••</span>
          ) : (
            <AnimatedCounter value={summary.lifetime_total_balance} />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="text-slate-600 dark:text-slate-300 font-semibold truncate">
            {walletsCount} Dompet & Rekening aktif
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold shrink-0">
            Kas Nyata
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
          <span className="truncate text-[10.5px]">Kas Tunai + Bank + E-Wallet</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
        </div>
      </motion.div>

      {/* 4. SISA LIMIT HARI INI */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all relative overflow-hidden ${
          summary.alert_level_daily === 'danger'
            ? 'border-rose-500 ring-2 ring-rose-500/30'
            : summary.alert_level_daily === 'warning'
            ? 'border-amber-400 ring-1 ring-amber-400/30'
            : 'border-slate-200/80 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold ${
            summary.alert_level_daily === 'danger'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              : summary.alert_level_daily === 'warning'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              : 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
          }`}>
            <Flame className="w-5 h-5" />
          </div>
          <SmartAlertBadge
            status={summary.alert_level_daily}
            size="sm"
            label={summary.alert_level_daily === 'danger' ? 'Over Limit!' : undefined}
          />
        </div>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Sisa Limit Hari Ini (Pagu: {privacyMode ? '•••' : formatRupiah(summary.daily_limit)}/hari)
        </p>

        <div className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${
          summary.remaining_today < 0
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-900 dark:text-white'
        }`}>
          {privacyMode ? (
            <span className="tracking-widest">Rp ••••••••</span>
          ) : (
            <AnimatedCounter value={summary.remaining_today} />
          )}
        </div>

        {/* Progress Bar Limit Harian */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Belanja: {privacyMode ? '•••' : (summary.spent_today / 1000).toFixed(0) + ' rb'}</span>
            <span>Limit: {privacyMode ? '•••' : (summary.daily_limit / 1000).toFixed(0) + ' rb'}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyUsedPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                dailyUsedPercent >= 100
                  ? 'bg-rose-500'
                  : dailyUsedPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-brand-500'
              }`}
            />
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
          <span className="truncate">Disiplin Harian</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold shrink-0">
            {summary.days_left_in_month} Hari Tersisa
          </span>
        </div>
      </motion.div>

    </div>
  );
};
