import React from 'react';
import { motion } from 'framer-motion';
import {
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  Flame,
  ArrowRight
} from 'lucide-react';
import { MonthSummary } from '../../types/database';
import { formatRupiah } from '../../lib/utils';
import { SmartAlertBadge } from '../common/SmartAlertBadge';

interface SmartLimitControlProps {
  summary: MonthSummary;
  privacyMode: boolean;
  onOpenAddModal: () => void;
}

export const SmartLimitControl: React.FC<SmartLimitControlProps> = ({
  summary,
  privacyMode,
  onOpenAddModal
}) => {
  const dailyRatio = summary.daily_limit > 0 ? (summary.spent_today / summary.daily_limit) * 100 : 0;
  const weeklyRatio = summary.weekly_limit > 0 ? (summary.spent_this_week / summary.weekly_limit) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Kontrol Limit & Smart Alert</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Otomatis
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pagu aman pengeluaran agar Anda tidak kehabisan uang sebelum akhir bulan
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="self-start sm:self-auto text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 transition"
        >
          <span>Catat Pengeluaran Baru</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: 2 Columns (Daily & Weekly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* KONTROL LIMIT HARIAN */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 relative ${
          summary.alert_level_daily === 'danger'
            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-lg shadow-rose-500/10'
            : summary.alert_level_daily === 'warning'
            ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-md shadow-amber-500/10'
            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                summary.alert_level_daily === 'danger'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : summary.alert_level_daily === 'warning'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}>
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Batas Pengeluaran Hari Ini
              </h3>
            </div>
            <SmartAlertBadge status={summary.alert_level_daily} size="sm" />
          </div>

          {/* Numbers comparison */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200/60 dark:border-slate-700/60 text-center">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Limit Harian (1 Bln: {summary.total_days_in_month} Hari)</p>
              <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {privacyMode ? '•••' : formatRupiah(summary.daily_limit)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Terpakai</p>
              <p className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                {privacyMode ? '•••' : formatRupiah(summary.spent_today)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sisa Hari Ini</p>
              <p className={`text-xs sm:text-sm font-extrabold mt-0.5 ${
                summary.remaining_today < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {privacyMode ? '•••' : formatRupiah(summary.remaining_today)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
              <span>Konsumsi Kuota Hari Ini</span>
              <span>{Math.round(dailyRatio)}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, dailyRatio)}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${
                  summary.alert_level_daily === 'danger'
                    ? 'bg-rose-500'
                    : summary.alert_level_daily === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Contextual Smart Alert Message */}
          <div className="mt-3 text-xs leading-relaxed">
            {summary.alert_level_daily === 'danger' ? (
              <p className="text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Perhatian! Belanja hari ini melampaui limit sebesar {formatRupiah(Math.abs(summary.remaining_today))}. Kurangi belanja esok hari!
                </span>
              </p>
            ) : summary.alert_level_daily === 'warning' ? (
              <p className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Waspada! Anda telah menggunakan {Math.round(dailyRatio)}% dari jatah hari ini. Tahan belanja non-esensial sampai besok.
                </span>
              </p>
            ) : (
              <p className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Kondisi sangat aman. Masih tersedia {formatRupiah(summary.remaining_today)} untuk kebutuhan hari ini.
                </span>
              </p>
            )}
          </div>
        </div>

        {/* KONTROL LIMIT MINGGUAN */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 relative ${
          summary.alert_level_weekly === 'danger'
            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
            : summary.alert_level_weekly === 'warning'
            ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Batas Pengeluaran Minggu Ini
              </h3>
            </div>
            <SmartAlertBadge status={summary.alert_level_weekly} size="sm" />
          </div>

          {/* Numbers comparison */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200/60 dark:border-slate-700/60 text-center">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Limit Mingguan (7 Hari)</p>
              <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {privacyMode ? '•••' : formatRupiah(summary.weekly_limit)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Terpakai</p>
              <p className="text-xs sm:text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                {privacyMode ? '•••' : formatRupiah(summary.spent_this_week)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sisa Minggu Ini</p>
              <p className={`text-xs sm:text-sm font-extrabold mt-0.5 ${
                summary.remaining_this_week < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {privacyMode ? '•••' : formatRupiah(summary.remaining_this_week)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
              <span>Konsumsi Kuota Minggu Ini</span>
              <span>{Math.round(weeklyRatio)}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, weeklyRatio)}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${
                  summary.alert_level_weekly === 'danger'
                    ? 'bg-rose-500'
                    : summary.alert_level_weekly === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                }`}
              />
            </div>
          </div>

          {/* Contextual Smart Alert Message */}
          <div className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {summary.alert_level_weekly === 'danger' ? (
              <p className="text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Pengeluaran minggu ini telah defisit {formatRupiah(Math.abs(summary.remaining_this_week))}. Jaga ketat anggaran sampai awal pekan depan.
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                <span>
                  Sisa anggaran mingguan Anda masih {formatRupiah(summary.remaining_this_week)}. Masih ada {summary.days_left_in_month} hari sampai tutup buku bulan ini.
                </span>
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
