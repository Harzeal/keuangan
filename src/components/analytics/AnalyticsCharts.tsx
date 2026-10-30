import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { PieChart as PieIcon, BarChart3, Layers, Filter } from 'lucide-react';
import { Transaction, MonthSummary } from '../../types/database';
import { formatRupiah, formatMonthYear } from '../../lib/utils';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  summary: MonthSummary;
  monthlyComparison: { month: string; income: number; expense: number; savings: number }[];
  privacyMode: boolean;
}

const ALLOCATION_COLORS = {
  needs: '#0284c7', // Sky Blue
  wants: '#f59e0b', // Amber
  savings: '#10b981' // Emerald
};

const CATEGORY_PALETTE = [
  '#6366f1', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6',
  '#f97316', '#3b82f6', '#84cc16', '#a855f7', '#e11d48'
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  summary,
  monthlyComparison,
  privacyMode
}) => {
  const [donutView, setDonutView] = useState<'allocation' | 'category'>('allocation');

  // 1. Data untuk Donut Alokasi (Needs vs Wants vs Savings)
  const allocationData = [
    { name: 'Kebutuhan (Needs)', value: summary.needs_expense, color: ALLOCATION_COLORS.needs },
    { name: 'Keinginan (Wants)', value: summary.wants_expense, color: ALLOCATION_COLORS.wants },
    { name: 'Tabungan (Savings)', value: summary.savings_allocated, color: ALLOCATION_COLORS.savings },
  ].filter(item => item.value > 0);

  // 2. Data untuk Donut Kategori Spesifik
  const categoryMap: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryMap[t.category_name] = (categoryMap[t.category_name] || 0) + Number(t.amount);
    });

  const categoryData = Object.entries(categoryMap)
    .map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7); // Ambil top 7 kategori pengeluaran terbesar

  // 3. Format Data untuk Bar Chart Perbandingan Bulan (MoM)
  const barData = monthlyComparison.map(item => ({
    name: formatMonthYear(item.month).split(' ')[0], // Nama bulan singkat
    Pemasukan: item.income,
    Pengeluaran: item.expense,
    Tabungan: item.savings
  }));

  const activeDonutData = donutView === 'allocation' ? allocationData : categoryData;

  // Custom Tooltip Donut
  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = activeDonutData.reduce((acc, curr) => acc + curr.value, 0);
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs backdrop-blur-md">
          <p className="font-bold">{data.name}</p>
          <p className="text-slate-300 mt-1">
            Nominal: <span className="font-bold text-white">{privacyMode ? '••••••' : formatRupiah(data.value)}</span>
          </p>
          <p className="text-indigo-300 font-semibold mt-0.5">
            Porsi: {percent}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip Bar
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs backdrop-blur-md space-y-1">
          <p className="font-bold border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span className="font-bold">{privacyMode ? '••••••' : formatRupiah(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. ANIMATED DONUT CHART: DISTRIBUSI PENGELUARAN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Distribusi Pengeluaran
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Persentase alokasi & kategori pengeluaran bulan ini
                </p>
              </div>
            </div>

            {/* Toggle Donut View: Alokasi vs Kategori */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setDonutView('allocation')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  donutView === 'allocation'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Pos 50/20/30
              </button>
              <button
                onClick={() => setDonutView('category')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  donutView === 'category'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Per Kategori
              </button>
            </div>
          </div>

          {/* Donut Container */}
          <div className="h-64 sm:h-72 w-full relative">
            {activeDonutData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Layers className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs">Belum ada data transaksi pengeluaran bulan ini.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={activeDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {activeDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center Label inside Donut */}
            {activeDonutData.length > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Keluar</p>
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {privacyMode ? '••••••' : formatRupiah(summary.total_expense + summary.savings_allocated)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-center">
          {activeDonutData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ANIMATED BAR CHART: PERBANDINGAN ANTAR BULAN (MONTH-OVER-MONTH) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Perbandingan Antar Bulan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Komparasi tren pemasukan vs pengeluaran (6 bulan terakhir)
                </p>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 sm:h-72 w-full">
            {barData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs">Belum ada riwayat transaksi multi-bulan.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => privacyMode ? '••' : `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 10, fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="Pemasukan"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1200}
                  />
                  <Bar
                    dataKey="Pengeluaran"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1200}
                  />
                  <Bar
                    dataKey="Tabungan"
                    fill="#a855f7"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1200}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Grafik otomatis menyesuaikan secara real-time saat Anda menambah transaksi baru
        </div>
      </div>

    </div>
  );
};
