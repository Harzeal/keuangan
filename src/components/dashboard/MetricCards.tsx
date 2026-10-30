import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  CalendarCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { MonthSummary } from '../../types/database';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { SmartAlertBadge } from '../common/SmartAlertBadge';

interface MetricCardsProps {
  summary: MonthSummary;
  privacyMode: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, privacyMode }) => {
  // Hitung persentase penggunaan anggaran bulanan
  const totalBudget = summary.budget_needs + summary.budget_wants;
  const budgetUsedPercent = totalBudget > 0 ? Math.min(100, Math.round((summary.total_expense / totalBudget) * 100)) : 0;

  // Hitung persentase penggunaan limit harian
  const dailyUsedPercent = summary.daily_limit > 0 ? Math.min(100, Math.round((summary.spent_today / summary.daily_limit) * 100)) : 0;

  // Hitung persentase penggunaan limit mingguan
  const weeklyUsedPercent = summary.weekly_limit > 0 ? Math.min(100, Math.round((summary.spent_this_week / summary.weekly_limit) * 100)) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' }
    })
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* 1. TOTAL SALDO BERSIH (NET BALANCE) */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Arus Kas Bulan Ini
          </span>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Total Saldo Bersih
        </p>

        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {privacyMode ? (
            <span className="tracking-widest">Rp ••••••••</span>
          ) : (
            <AnimatedCounter value={summary.net_savings} />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{privacyMode ? '•••' : (summary.income > 0 ? `${((summary.income - summary.total_expense) / summary.income * 100).toFixed(0)}%` : '0%')} Rasio Kas</span>
          </div>
          <span>Saving: {summary.savings_rate_percent.toFixed(0)}%</span>
        </div>
      </motion.div>

      {/* 2. SISA ANGGARAN BULANAN */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border shadow-sm transition-all relative overflow-hidden ${
          summary.alert_level_monthly === 'danger'
            ? 'border-rose-400 dark:border-rose-700/80 ring-1 ring-rose-400'
            : 'border-slate-200/80 dark:border-slate-800 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
            summary.alert_level_monthly === 'danger'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
          }`}>
            <PiggyBank className="w-6 h-6" />
          </div>
          <SmartAlertBadge status={summary.alert_level_monthly} size="sm" />
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Sisa Anggaran Bulanan
        </p>

        <div className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${
          summary.remaining_total_budget < 0
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-900 dark:text-white'
        }`}>
          {privacyMode ? (
            <span className="tracking-widest">Rp ••••••••</span>
          ) : (
            <AnimatedCounter value={summary.remaining_total_budget} />
          )}
        </div>

        {/* Progress Bar Anggaran Bulanan */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Terpakai {budgetUsedPercent}%</span>
            <span>Total Pagu: {privacyMode ? '•••' : (totalBudget / 1000000).toFixed(1) + 'Jt'}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${budgetUsedPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                budgetUsedPercent > 100
                  ? 'bg-rose-500'
                  : budgetUsedPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* 3. SISA LIMIT HARI INI & SMART ALERT */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border shadow-sm transition-all relative overflow-hidden ${
          summary.alert_level_daily === 'danger'
            ? 'border-rose-500 ring-2 ring-rose-500/30 animate-pulse'
            : summary.alert_level_daily === 'warning'
            ? 'border-amber-400 ring-1 ring-amber-400/30'
            : 'border-slate-200/80 dark:border-slate-800 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
            summary.alert_level_daily === 'danger'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              : summary.alert_level_daily === 'warning'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              : 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
          }`}>
            <Flame className="w-6 h-6" />
          </div>
          <SmartAlertBadge
            status={summary.alert_level_daily}
            size="sm"
            label={summary.alert_level_daily === 'danger' ? 'Over Limit!' : undefined}
          />
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Sisa Limit Hari Ini ({summary.days_left_in_month} hari tersisa)
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
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Belanja: {privacyMode ? '•••' : (summary.spent_today / 1000).toFixed(0) + ' rb'}</span>
            <span>Limit: {privacyMode ? '•••' : (summary.daily_limit / 1000).toFixed(0) + ' rb'}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
      </motion.div>

      {/* 4. SISA LIMIT MINGGU INI */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border shadow-sm transition-all relative overflow-hidden ${
          summary.alert_level_weekly === 'danger'
            ? 'border-rose-400 dark:border-rose-700/80 ring-1 ring-rose-400'
            : 'border-slate-200/80 dark:border-slate-800 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Minggu Berjalan
          </span>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Sisa Limit Minggu Ini
        </p>

        <div className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${
          summary.remaining_this_week < 0
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-900 dark:text-white'
        }`}>
          {privacyMode ? (
            <span className="tracking-widest">Rp ••••••••</span>
          ) : (
            <AnimatedCounter value={summary.remaining_this_week} />
          )}
        </div>

        {/* Progress Bar Limit Mingguan */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Terpakai {weeklyUsedPercent}%</span>
            <span>Limit: {privacyMode ? '•••' : (summary.weekly_limit / 1000).toFixed(0) + ' rb'}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${weeklyUsedPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                weeklyUsedPercent >= 100
                  ? 'bg-rose-500'
                  : weeklyUsedPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-purple-500'
              }`}
            />
          </div>
        </div>
      </motion.div>

    </div>
  );
};
