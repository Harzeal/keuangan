import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, FileSpreadsheet, Download, Check, Calendar } from 'lucide-react';
import { Transaction, MonthSummary, BudgetSettings } from '../../types/database';
import { exportToPDF, exportToCSV } from '../../lib/exportUtils';
import { formatMonthYear } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface ExportModalProps {
  transactions: Transaction[];
  summary: MonthSummary;
  budgetSettings: BudgetSettings;
  monthYear: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  transactions,
  summary,
  budgetSettings,
  monthYear,
  onClose
}) => {
  const { profile, user } = useAuth();
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Pengguna FinFlow';
  const period = formatMonthYear(monthYear);

  const [downloading, setDownloading] = useState<'pdf' | 'csv' | null>(null);

  // Tutup modal ketika tombol Escape (ESC) ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExportPDF = () => {
    setDownloading('pdf');
    setTimeout(() => {
      exportToPDF(transactions, summary, budgetSettings, monthYear, userName);
      setDownloading(null);
    }, 400);
  };

  const handleExportCSV = () => {
    setDownloading('csv');
    setTimeout(() => {
      exportToCSV(transactions, summary, monthYear, userName);
      setDownloading(null);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100"
      >
        <button
          onClick={onClose}
          title="Tutup (Esc)"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
        >
          <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">Esc</span>
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 font-bold">
            <Download className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ekspor Laporan Keuangan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Periode: <b>{period}</b> ({transactions.length} transaksi)</span>
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Opsi 1: Dokumen PDF Resmi */}
          <button
            onClick={handleExportPDF}
            disabled={downloading !== null}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                  Dokumen Laporan PDF
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format tabel resmi, rapi, siap diprint atau dikirim
                </p>
              </div>
            </div>
            {downloading === 'pdf' ? (
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition" />
            )}
          </button>

          {/* Opsi 2: Spreadsheet Excel / CSV */}
          <button
            onClick={handleExportCSV}
            disabled={downloading !== null}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  Microsoft Excel / CSV
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kompatibel Excel, Google Sheets, kalkulasi angka
                </p>
              </div>
            </div>
            {downloading === 'csv' ? (
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            )}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition shadow-sm"
          >
            Selesai / Tutup (Esc)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
