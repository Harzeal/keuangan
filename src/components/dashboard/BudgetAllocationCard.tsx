import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Percent,
  Check,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Home,
  ShieldCheck,
  Save,
  RotateCcw
} from 'lucide-react';
import { BudgetSettings, MonthSummary } from '../../types/database';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { formatRupiah, parseRupiahInput } from '../../lib/utils';

interface BudgetAllocationCardProps {
  budgetSettings: BudgetSettings;
  summary: MonthSummary;
  onSave: (newSettings: Partial<BudgetSettings>) => Promise<{ error: any }>;
  privacyMode: boolean;
}

export const BudgetAllocationCard: React.FC<BudgetAllocationCardProps> = ({
  budgetSettings,
  summary,
  onSave,
  privacyMode
}) => {
  const [incomeInput, setIncomeInput] = useState<string>('');
  const [needsPercent, setNeedsPercent] = useState<number>(50);
  const [wantsPercent, setWantsPercent] = useState<number>(20);
  const [savingsPercent, setSavingsPercent] = useState<number>(30);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sinkronkan state lokal saat prop berubah
  useEffect(() => {
    if (budgetSettings) {
      setIncomeInput(
        budgetSettings.monthly_income > 0
          ? budgetSettings.monthly_income.toLocaleString('id-ID')
          : ''
      );
      setNeedsPercent(budgetSettings.needs_percentage || 50);
      setWantsPercent(budgetSettings.wants_percentage || 20);
      setSavingsPercent(budgetSettings.savings_percentage || 30);
    }
  }, [budgetSettings]);

  const totalPercentage = needsPercent + wantsPercent + savingsPercent;
  const is100Percent = totalPercentage === 100;

  const currentIncomeNumber = parseRupiahInput(incomeInput);

  // Kalkulasi nominal rupiah real-time sesuai slider
  const calcNeedsNominal = Math.round((currentIncomeNumber * needsPercent) / 100);
  const calcWantsNominal = Math.round((currentIncomeNumber * wantsPercent) / 100);
  const calcSavingsNominal = Math.round((currentIncomeNumber * savingsPercent) / 100);

  // Handler Simpan
  const handleSave = async () => {
    if (!is100Percent) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const { error } = await onSave({
      monthly_income: currentIncomeNumber,
      needs_percentage: needsPercent,
      wants_percentage: wantsPercent,
      savings_percentage: savingsPercent
    });

    setIsSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Preset Template
  const applyPreset = (needs: number, wants: number, savings: number) => {
    setNeedsPercent(needs);
    setWantsPercent(wants);
    setSavingsPercent(savings);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      
      {/* Header Alokasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Alokasi Anggaran Bulanan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prinsip 50/20/30 atau kustomisasi persentase sesuai rencana finansial Anda
            </p>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => applyPreset(50, 20, 30)}
            className={`px-2.5 py-1 rounded-lg transition ${
              needsPercent === 50 && wantsPercent === 20 && savingsPercent === 30
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            50/20/30 Klasik
          </button>
          <button
            type="button"
            onClick={() => applyPreset(60, 20, 20)}
            className={`px-2.5 py-1 rounded-lg transition ${
              needsPercent === 60 && wantsPercent === 20 && savingsPercent === 20
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            60/20/20 Hemat
          </button>
          <button
            type="button"
            onClick={() => applyPreset(40, 20, 40)}
            className={`px-2.5 py-1 rounded-lg transition ${
              needsPercent === 40 && wantsPercent === 20 && savingsPercent === 40
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            40/20/40 Invest
          </button>
        </div>
      </div>

      {/* Input Pemasukan / Total Uang Bulanan */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-50/60 via-indigo-50/40 to-purple-50/60 dark:from-slate-800/60 dark:via-indigo-950/20 dark:to-slate-800/60 border border-brand-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Total Pemasukan / Gaji Bulanan
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Masukkan target uang masuk bulan ini sebagai acuan pembagian nominal pos anggaran
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                Rp
              </span>
              <input
                type="text"
                placeholder="0"
                value={incomeInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  if (!raw) {
                    setIncomeInput('');
                  } else {
                    setIncomeInput(parseInt(raw, 10).toLocaleString('id-ID'));
                  }
                }}
                className="w-48 sm:w-56 pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving || !is100Percent}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition ${
                saveSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20 disabled:opacity-50'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersimpan!</span>
                </>
              ) : isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3 Interactive Pocket Cards (Kebutuhan, Keinginan, Tabungan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Pos 1: Kebutuhan (Needs) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Kebutuhan (Needs)
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Makan, tagihan, sewa, bensin
                </span>
              </div>
            </div>
            <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-lg">
              {needsPercent}%
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={needsPercent}
            onChange={(e) => setNeedsPercent(Number(e.target.value))}
            className="w-full accent-sky-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-3"
          />

          {/* Real-time Nominal Calculation with AnimatedCounter */}
          <div className="pt-2 border-t border-sky-100 dark:border-sky-900/30 flex items-baseline justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Nominal Pagu:</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {privacyMode ? (
                'Rp ••••••••'
              ) : (
                <AnimatedCounter value={calcNeedsNominal} />
              )}
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Terpakai:</span>
            <span className="font-semibold text-sky-700 dark:text-sky-300">
              {privacyMode ? '•••' : formatRupiah(summary.needs_expense)}
            </span>
          </div>
        </div>

        {/* Pos 2: Keinginan (Wants) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Keinginan (Wants)
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kafe, belanja, hobi, hiburan
                </span>
              </div>
            </div>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-lg">
              {wantsPercent}%
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={wantsPercent}
            onChange={(e) => setWantsPercent(Number(e.target.value))}
            className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-3"
          />

          {/* Real-time Nominal Calculation with AnimatedCounter */}
          <div className="pt-2 border-t border-amber-100 dark:border-amber-900/30 flex items-baseline justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Nominal Pagu:</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {privacyMode ? (
                'Rp ••••••••'
              ) : (
                <AnimatedCounter value={calcWantsNominal} />
              )}
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Terpakai:</span>
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {privacyMode ? '•••' : formatRupiah(summary.wants_expense)}
            </span>
          </div>
        </div>

        {/* Pos 3: Tabungan & Investasi (Savings) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Tabungan & Investasi
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dana darurat, saham, emas
                </span>
              </div>
            </div>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-lg">
              {savingsPercent}%
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={savingsPercent}
            onChange={(e) => setSavingsPercent(Number(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-3"
          />

          {/* Real-time Nominal Calculation with AnimatedCounter */}
          <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/30 flex items-baseline justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Target Disisihkan:</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {privacyMode ? (
                'Rp ••••••••'
              ) : (
                <AnimatedCounter value={calcSavingsNominal} />
              )}
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Tersimpan:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {privacyMode ? '•••' : formatRupiah(summary.savings_allocated)}
            </span>
          </div>
        </div>

      </div>

      {/* Validation Warning if Total !== 100% */}
      {!is100Percent && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Total persentase alokasi saat ini adalah <b>{totalPercentage}%</b>. Harap sesuaikan slider agar pas berjumlah <b>100%</b>.
            </span>
          </div>
          <button
            onClick={() => applyPreset(50, 20, 30)}
            className="underline font-bold text-xs shrink-0 ml-2"
          >
            Reset ke 100%
          </button>
        </motion.div>
      )}

    </div>
  );
};
