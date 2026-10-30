import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  LogOut,
  User as UserIcon,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Database,
  Download,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatMonthYear, getCurrentMonthYear } from '../../lib/utils';

interface NavbarProps {
  selectedMonthYear: string;
  onMonthChange: (monthYear: string) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenConfigModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedMonthYear,
  onMonthChange,
  privacyMode,
  onTogglePrivacy,
  darkMode,
  onToggleDarkMode,
  onOpenAddModal,
  onOpenExportModal,
  onOpenConfigModal
}) => {
  const { user, profile, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Navigasi bulan: mundur 1 bulan
  const handlePrevMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${prevYear}-${prevMonth}`);
  };

  // Navigasi bulan: maju 1 bulan
  const handleNextMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${nextYear}-${nextMonth}`);
  };

  const isCurrentMonth = selectedMonthYear === getCurrentMonthYear();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25"
            >
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-700 dark:from-white dark:via-indigo-200 dark:to-brand-400 bg-clip-text text-transparent">
                  FinFlow
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800">
                  Cloud RLS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                Personal Finance & Smart Budget
              </p>
            </div>
          </div>

          {/* Month Navigator (Centered on Desktop) */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 min-w-[120px] sm:min-w-[145px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{formatMonthYear(selectedMonthYear)}</span>
            </div>

            <button
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={() => onMonthChange(getCurrentMonthYear())}
                className="hidden md:inline-flex ml-1 px-2 py-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 rounded-md hover:bg-brand-100 transition"
              >
                Hari Ini
              </button>
            )}
          </div>

          {/* Right Action Tools & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Action: Tambah Transaksi */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenAddModal}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20 hover:shadow-brand-500/35 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </motion.button>

            {/* Ekspor Laporan */}
            <button
              onClick={onOpenExportModal}
              title="Ekspor PDF & Excel/CSV"
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Privacy Mode Toggle */}
            <button
              onClick={onTogglePrivacy}
              title={privacyMode ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal (Mode Privasi)'}
              className={`p-2 sm:p-2.5 rounded-xl border transition ${
                privacyMode
                  ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800'
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Database / Supabase Info */}
            <button
              onClick={onOpenConfigModal}
              title="Koneksi & Skema Supabase"
              className="p-2 sm:p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-brand-500/20 shadow-sm">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 divide-y divide-slate-100 dark:divide-slate-800"
                    >
                      <div className="px-4 py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Masuk sebagai:</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {profile?.full_name || 'Pengguna FinFlow'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenConfigModal();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          <Database className="w-4 h-4 text-indigo-500" />
                          <span>Status Koneksi Cloud</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            await signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar Akun (Logout)</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
