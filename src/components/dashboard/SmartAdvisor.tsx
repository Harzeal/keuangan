import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Target,
  BrainCircuit
} from 'lucide-react';
import { SmartRecommendation, MonthSummary } from '../../types/database';
import { formatRupiah } from '../../lib/utils';

interface SmartAdvisorProps {
  recommendations: SmartRecommendation[];
  summary: MonthSummary;
}

export const SmartAdvisor: React.FC<SmartAdvisorProps> = ({ recommendations, summary }) => {
  // Hitung Skor Kesehatan Finansial (Financial Health Score 0 - 100)
  let score = 100;

  // Penalti jika pos keinginan overbudget
  if (summary.wants_expense > summary.budget_wants) {
    const penalty = Math.min(30, Math.round(((summary.wants_expense - summary.budget_wants) / (summary.budget_wants || 1)) * 30));
    score -= penalty;
  }

  // Penalti jika pos kebutuhan overbudget
  if (summary.needs_expense > summary.budget_needs) {
    const penalty = Math.min(25, Math.round(((summary.needs_expense - summary.budget_needs) / (summary.budget_needs || 1)) * 25));
    score -= penalty;
  }

  // Penalti jika saving rate di bawah 20%
  if (summary.savings_rate_percent < 20) {
    score -= 20;
  }

  // Penalti jika limit harian saat ini terlampaui
  if (summary.remaining_today < 0) {
    score -= 10;
  }

  score = Math.max(25, Math.min(100, score));

  const scoreLabel =
    score >= 85
      ? 'Sangat Sehat & Stabil'
      : score >= 70
      ? 'Baik & Terkendali'
      : score >= 50
      ? 'Cukup (Perlu Waspada)'
      : 'Rentan Defisit (Perlu Pemangkasan)';

  const scoreColor =
    score >= 85
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200'
      : score >= 70
      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 border-brand-200'
      : score >= 50
      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200'
      : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Rekomendasi Pintar & Analisis AI
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Smart Advisor
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluasi pola belanja dan saran optimalisasi alokasi untuk bulan berikutnya
            </p>
          </div>
        </div>

        {/* Skor Kesehatan Finansial */}
        <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border ${scoreColor}`}>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider">Health Score</p>
            <p className="text-xs font-bold">{scoreLabel}</p>
          </div>
          <div className="text-xl sm:text-2xl font-black">{score}</div>
        </div>
      </div>

      {/* Grid Rekomendasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, idx) => {
          const config = {
            warning: {
              border: 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20',
              icon: AlertTriangle,
              iconColor: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40'
            },
            success: {
              border: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20',
              icon: CheckCircle2,
              iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40'
            },
            tip: {
              border: 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20',
              icon: Lightbulb,
              iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40'
            },
            action: {
              border: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20',
              icon: Target,
              iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40'
            }
          }[rec.type];

          const Icon = config.icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className={`p-4 rounded-2xl border ${config.border} flex items-start gap-3.5 transition-shadow hover:shadow-sm`}
            >
              <div className={`p-2.5 rounded-xl ${config.iconColor} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rec.message}
                </p>
                {rec.impactNominal && (
                  <div className="pt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    Defisit Pagu: {formatRupiah(rec.impactNominal)}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
