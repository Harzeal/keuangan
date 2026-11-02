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

  // State nominal string yang dapat diedit langsung
  const [needsNominalStr, setNeedsNominalStr] = useState<string>('');
  const [wantsNominalStr, setWantsNominalStr] = useState<string>('');
  const [savingsNominalStr, setSavingsNominalStr] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const currentIncomeNumber = parseRupiahInput(incomeInput);

  // Sinkronkan state saat prop budgetSettings atau summary.income berubah
  useEffect(() => {
    // Prioritaskan total pemasukan riil dari transaksi jika ada, atau dari budgetSettings
    const effectiveIncome = summary.income > 0 ? summary.income : Number(budgetSettings?.monthly_income || 0);
    setIncomeInput(effectiveIncome > 0 ? effectiveIncome.toLocaleString('id-ID') : '');

    const np = budgetSettings?.needs_percentage ?? 50;
    const wp = budgetSettings?.wants_percentage ?? 20;
    const sp = budgetSettings?.savings_percentage ?? 30;
    setNeedsPercent(np);
    setWantsPercent(wp);
    setSavingsPercent(sp);

    if (effectiveIncome > 0) {
      setNeedsNominalStr(formatRupiah(Math.round((effectiveIncome * np) / 100)));
      setWantsNominalStr(formatRupiah(Math.round((effectiveIncome * wp) / 100)));
      setSavingsNominalStr(formatRupiah(Math.round((effectiveIncome * sp) / 100)));
    }
  }, [budgetSettings, summary.income]);

  // Handler saat income bulanan diedit manual
  const handleIncomeChange = (valStr: string) => {
    const raw = valStr.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setIncomeInput(num > 0 ? num.toLocaleString('id-ID') : '');

    if (num > 0) {
      setNeedsNominalStr(formatRupiah(Math.round((num * needsPercent) / 100)));
      setWantsNominalStr(formatRupiah(Math.round((num * wantsPercent) / 100)));
      setSavingsNominalStr(formatRupiah(Math.round((num * savingsPercent) / 100)));
    }
  };

  // Batas Maksimal Masing-masing Pos Agar Total TIDAK PERNAH Melebihi 100%
  // Jika Keinginan 20% dan Tabungan 30%, Kebutuhan mentok di 50%
  const maxNeeds = Math.max(0, 100 - wantsPercent - savingsPercent);
  const maxWants = Math.max(0, 100 - needsPercent - savingsPercent);
  const maxSavings = Math.max(0, 100 - needsPercent - wantsPercent);

  // Handler saat slider persentase digeser (Mentok otomatis di sisa 100%)
  const handleNeedsPercentChange = (val: number) => {
    const capped = Math.min(val, maxNeeds);
    setNeedsPercent(capped);
    if (currentIncomeNumber > 0) {
      setNeedsNominalStr(formatRupiah(Math.round((currentIncomeNumber * capped) / 100)));
    }
  };

  const handleWantsPercentChange = (val: number) => {
    const capped = Math.min(val, maxWants);
    setWantsPercent(capped);
    if (currentIncomeNumber > 0) {
      setWantsNominalStr(formatRupiah(Math.round((currentIncomeNumber * capped) / 100)));
    }
  };

  const handleSavingsPercentChange = (val: number) => {
    const capped = Math.min(val, maxSavings);
    setSavingsPercent(capped);
    if (currentIncomeNumber > 0) {
      setSavingsNominalStr(formatRupiah(Math.round((currentIncomeNumber * capped) / 100)));
    }
  };

  // Handler saat nominal diketik langsung (Dua Arah: Persen Menyesuaikan dan Mentok di Max)
  const handleNeedsNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRupiahInput(e.target.value);
    const maxNominal = currentIncomeNumber > 0 ? Math.round((currentIncomeNumber * maxNeeds) / 100) : raw;
    const cappedNominal = Math.min(raw, maxNominal);
    setNeedsNominalStr(cappedNominal > 0 ? formatRupiah(cappedNominal) : '');

    if (currentIncomeNumber > 0) {
      const calcPct = Math.min(maxNeeds, Math.max(0, Math.round((cappedNominal / currentIncomeNumber) * 100)));
      setNeedsPercent(calcPct);
    }
  };

  const handleWantsNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRupiahInput(e.target.value);
    const maxNominal = currentIncomeNumber > 0 ? Math.round((currentIncomeNumber * maxWants) / 100) : raw;
    const cappedNominal = Math.min(raw, maxNominal);
    setWantsNominalStr(cappedNominal > 0 ? formatRupiah(cappedNominal) : '');

    if (currentIncomeNumber > 0) {
      const calcPct = Math.min(maxWants, Math.max(0, Math.round((cappedNominal / currentIncomeNumber) * 100)));
      setWantsPercent(calcPct);
    }
  };

  const handleSavingsNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRupiahInput(e.target.value);
    const maxNominal = currentIncomeNumber > 0 ? Math.round((currentIncomeNumber * maxSavings) / 100) : raw;
    const cappedNominal = Math.min(raw, maxNominal);
    setSavingsNominalStr(cappedNominal > 0 ? formatRupiah(cappedNominal) : '');

    if (currentIncomeNumber > 0) {
      const calcPct = Math.min(maxSavings, Math.max(0, Math.round((cappedNominal / currentIncomeNumber) * 100)));
      setSavingsPercent(calcPct);
    }
  };

  const totalPercentage = needsPercent + wantsPercent + savingsPercent;
  const is100Percent = totalPercentage === 100;

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

  // Preset Template (Pasti Pas 100%)
  const applyPreset = (needs: number, wants: number, savings: number) => {
    setNeedsPercent(needs);
    setWantsPercent(wants);
    setSavingsPercent(savings);
    if (currentIncomeNumber > 0) {
      setNeedsNominalStr(formatRupiah(Math.round((currentIncomeNumber * needs) / 100)));
      setWantsNominalStr(formatRupiah(Math.round((currentIncomeNumber * wants) / 100)));
      setSavingsNominalStr(formatRupiah(Math.round((currentIncomeNumber * savings) / 100)));
    }
  };

  // Seimbangkan ke 100% secara otomatis (Masukkan sisa ke tabungan)
  const autoBalanceTo100 = () => {
    const remaining = 100 - needsPercent - wantsPercent;
    if (remaining >= 0) {
      setSavingsPercent(remaining);
      if (currentIncomeNumber > 0) {
        setSavingsNominalStr(formatRupiah(Math.round((currentIncomeNumber * remaining) / 100)));
      }
    } else {
      applyPreset(50, 20, 30);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      
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
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold flex-wrap">
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
          <button
            type="button"
            onClick={() => applyPreset(70, 20, 10)}
            className={`px-2.5 py-1 rounded-lg transition ${
              needsPercent === 70 && wantsPercent === 20 && savingsPercent === 10
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            70/20/10 Bertahan
          </button>
        </div>
      </div>

      {/* Input Pemasukan / Total Uang Bulanan */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-50/60 via-indigo-50/40 to-purple-50/60 dark:from-slate-800/60 dark:via-indigo-950/20 dark:to-slate-800/60 border border-brand-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Total Pemasukan Bulan Ini
              </label>
              {summary.income > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Otomatis Akumulasi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.income > 0
                ? 'Total bertambah otomatis setiap Anda mencatat transaksi pemasukan baru'
                : 'Target estimasi uang masuk. Nominal pos di bawah otomatis menyesuaikan'}
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
                onChange={(e) => handleIncomeChange(e.target.value)}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        
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
            <div className="text-right">
              <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-lg inline-block">
                {needsPercent}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Maks: {maxNeeds}%
              </span>
            </div>
          </div>

          {/* Slider Persen (Mentok di maxNeeds) */}
          <input
            type="range"
            min="0"
            max={maxNeeds}
            step="1"
            value={needsPercent}
            onChange={(e) => handleNeedsPercentChange(Number(e.target.value))}
            className="w-full accent-sky-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-3"
          />

          {/* Input Nominal Langsung (Dua Arah) */}
          <div className="pt-2.5 border-t border-sky-100 dark:border-sky-900/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Nominal Pagu:</span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">Ketik langsung</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={privacyMode ? '••••••••' : needsNominalStr}
                disabled={privacyMode}
                onChange={handleNeedsNominalChange}
                placeholder="0"
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800/80 rounded-xl text-sm sm:text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="mt-2.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
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
            <div className="text-right">
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-lg inline-block">
                {wantsPercent}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Maks: {maxWants}%
              </span>
            </div>
          </div>

          {/* Slider Persen (Mentok di maxWants) */}
          <input
            type="range"
            min="0"
            max={maxWants}
            step="1"
            value={wantsPercent}
            onChange={(e) => handleWantsPercentChange(Number(e.target.value))}
            className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-3"
          />

          {/* Input Nominal Langsung (Dua Arah) */}
          <div className="pt-2.5 border-t border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Nominal Pagu:</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Ketik langsung</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={privacyMode ? '••••••••' : wantsNominalStr}
                disabled={privacyMode}
                onChange={handleWantsNominalChange}
                placeholder="0"
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-xl text-sm sm:text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="mt-2.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
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
            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-lg inline-block">
                {savingsPercent}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Maks: {maxSavings}%
              </span>
            </div>
          </div>

          {/* Slider Persen (Mentok di maxSavings) */}
          <input
            type="range"
            min="0"
            max={maxSavings}
            step="1"
            value={savingsPercent}
            onChange={(e) => handleSavingsPercentChange(Number(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-3"
          />

          {/* Input Nominal Langsung (Dua Arah) */}
          <div className="pt-2.5 border-t border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target Disisihkan:</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Ketik langsung</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={privacyMode ? '••••••••' : savingsNominalStr}
                disabled={privacyMode}
                onChange={handleSavingsNominalChange}
                placeholder="0"
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-sm sm:text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="mt-2.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Tersimpan Bulan Ini:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {privacyMode ? '•••' : formatRupiah(summary.savings_allocated)}
            </span>
          </div>
        </div>

      </div>

      {/* Visual Allocation Composition Bar */}
      <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 dark:text-slate-300">Komposisi Anggaran Total</span>
          <span className={is100Percent ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
            {totalPercentage}% dari 100% {is100Percent && '✓ Sempurna'}
          </span>
        </div>
        
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
          {needsPercent > 0 && (
            <div style={{ width: `${needsPercent}%` }} className="bg-sky-500 transition-all duration-200" title={`Kebutuhan: ${needsPercent}%`} />
          )}
          {wantsPercent > 0 && (
            <div style={{ width: `${wantsPercent}%` }} className="bg-amber-500 transition-all duration-200" title={`Keinginan: ${wantsPercent}%`} />
          )}
          {savingsPercent > 0 && (
            <div style={{ width: `${savingsPercent}%` }} className="bg-emerald-500 transition-all duration-200" title={`Tabungan: ${savingsPercent}%`} />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Kebutuhan ({needsPercent}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Keinginan ({wantsPercent}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tabungan ({savingsPercent}%)</span>
          </div>

          {!is100Percent && (
            <button
              type="button"
              onClick={autoBalanceTo100}
              className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1 ml-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Isi Sisa {100 - totalPercentage}% ke Tabungan</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Warning if Total !== 100% */}
      {!is100Percent && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Total alokasi saat ini <b>{totalPercentage}%</b>. Masih ada <b>{100 - totalPercentage}%</b> yang belum teralokasi.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={autoBalanceTo100}
              className="px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-300/60 text-amber-900 dark:text-amber-200 font-bold text-[11px] transition"
            >
              Genapkan ke 100%
            </button>
            <button
              onClick={() => applyPreset(50, 20, 30)}
              className="underline font-bold text-[11px]"
            >
              Reset 50/20/30
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
};
