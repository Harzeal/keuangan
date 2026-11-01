import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Database,
  Key,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { getStoredCredentials, saveCustomCredentials, resetCredentials } from '../../lib/supabase';

interface ConfigModalProps {
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ onClose }) => {
  const currentCreds = getStoredCredentials();

  const [urlInput, setUrlInput] = useState(currentCreds.url);
  const [keyInput, setKeyInput] = useState(currentCreds.key);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomCredentials(urlInput, keyInput);
  };

  const handleCopySql = () => {
    // Teks ringkasan instruksi SQL
    const sampleSql = `-- Jalankan file supabase_schema.sql di SQL Editor Supabase Anda
-- File lengkap tersedia di folder proyek: supabase_schema.sql`;
    navigator.clipboard.writeText(sampleSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-16 pb-8 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-4"
      >
        <button
          onClick={onClose}
          title="Tutup (Esc)"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 font-bold">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Konfigurasi Database Supabase
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            FinFlow terintegrasi langsung dengan Supabase Auth & PostgreSQL dengan Row Level Security (RLS).
          </p>
        </div>

        {/* Status Cloud Badge */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Koneksi Cloud Siap Digunakan</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            Multi-User RLS Active
          </span>
        </div>

        {/* Link ke Supabase SQL Editor */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Skema Database SQL (`supabase_schema.sql`)</span>
            </span>
            <a
              href="https://supabase.com/dashboard/project/sxwnweslamgdegmjsznm/sql/new"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>Buka SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Skrip SQL lengkap untuk membuat tabel <b>profiles, transactions, categories,</b> dan <b>budget_settings</b> sudah tersedia di dalam file <code className="text-brand-600 dark:text-brand-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">supabase_schema.sql</code> di direktori proyek ini.
          </p>
        </div>

        {/* Form Ubah Kredensial (Jika User Ingin Menggunakan Proyek Sendiri) */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Supabase Project URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Supabase Publishable / Anon Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sb_publishable_..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={resetCredentials}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Reset ke Default
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md transition"
            >
              Simpan & Hubungkan Ulang
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
};
