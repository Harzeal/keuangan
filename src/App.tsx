import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  PlusCircle,
  BarChart3,
  Download,
  Settings,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useBudget } from './hooks/useBudget';
import { getCurrentMonthYear, formatMonthYear, formatRupiah } from './lib/utils';

// Components
import { AuthPage } from './components/auth/AuthPage';
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal';
import { Navbar } from './components/common/Navbar';
import { MetricCards } from './components/dashboard/MetricCards';
import { WalletOverviewCard } from './components/dashboard/WalletOverviewCard';
import { RecurringManagerCard } from './components/dashboard/RecurringManagerCard';
import { BudgetAllocationCard } from './components/dashboard/BudgetAllocationCard';
import { SmartLimitControl } from './components/dashboard/SmartLimitControl';
import { SmartAdvisor } from './components/dashboard/SmartAdvisor';
import { TransactionList } from './components/transactions/TransactionList';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { CategoryManagerModal } from './components/transactions/CategoryManagerModal';
import { ConfigModal } from './components/common/ConfigModal';
import { NotificationSettingsModal } from './components/notifications/NotificationSettingsModal';
import {
  initServiceWorker,
  checkAndTriggerScheduledNotifications,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  scheduleDailyReminderNative
} from './lib/notificationEngine';
import { AppNotification } from './types/database';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Code Splitting / Lazy Loading for heavy components (Recharts & jsPDF)
const AnalyticsCharts = React.lazy(() =>
  import('./components/analytics/AnalyticsCharts').then((m) => ({ default: m.AnalyticsCharts }))
);
const ExportModal = React.lazy(() =>
  import('./components/export/ExportModal').then((m) => ({ default: m.ExportModal }))
);

export const App: React.FC = () => {
  const { user, profile, loading: authLoading, isPasswordRecovery, setIsPasswordRecovery } = useAuth();

  // State Bulan Terpilih (Format: 'YYYY-MM')
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(getCurrentMonthYear());

  // State Notifikasi Terpadu (.apk / .app / .exe / web)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState<boolean>(false);

  // Privacy Mode (Sembunyikan angka saldo)
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('FINFLOW_PRIVACY') === 'true';
  });

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('FINFLOW_THEME') === 'dark' ||
      (!localStorage.getItem('FINFLOW_THEME') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFromSavings, setIsAddFromSavings] = useState(false);
  const [addModalInitialType, setAddModalInitialType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // State Filter Dompet Terpilih
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string | null>(null);

  // Hook Budget & Transaksi
  const {
    transactions,
    budgetSettings,
    categories,
    loading: budgetLoading,
    isOffline,
    wallets,
    addWallet,
    deleteWallet,
    updateWallet,
    recurringList,
    addRecurring,
    deleteRecurring,
    toggleRecurring,
    processRecurring,
    summary,
    recommendations,
    monthlyComparison,
    addTransaction,
    deleteTransaction,
    saveBudgetSettings,
    addCustomCategory,
    deleteCustomCategory
  } = useBudget(selectedMonthYear);

  // Listener Tombol Back Fisik Android (Tutup modal yang terbuka dulu sebelum exit)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (isAddModalOpen) {
        setIsAddModalOpen(false);
        return;
      }
      if (isCategoryModalOpen) {
        setIsCategoryModalOpen(false);
        return;
      }
      if (isExportModalOpen) {
        setIsExportModalOpen(false);
        return;
      }
      if (isNotifSettingsOpen) {
        setIsNotifSettingsOpen(false);
        return;
      }
      if (isConfigModalOpen) {
        setIsConfigModalOpen(false);
        return;
      }

      if (!canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backListener.then((handle) => handle.remove());
    };
  }, [isAddModalOpen, isCategoryModalOpen, isExportModalOpen, isNotifSettingsOpen, isConfigModalOpen]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('FINFLOW_THEME', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('FINFLOW_THEME', 'light');
    }
  }, [darkMode]);

  // Inisialisasi Service Worker & Jadwal Notifikasi Harian Native Android
  useEffect(() => {
    initServiceWorker();
    scheduleDailyReminderNative();
  }, []);

  // Muat riwayat notifikasi tersimpan saat user login
  useEffect(() => {
    if (user) {
      fetchUserNotifications(user.id).then(setNotifications);
    }
  }, [user]);

  // Pemeriksaan jadwal otomatis (Jam 20:00 Harian, Senin 2 Notif, Akhir Bulan)
  useEffect(() => {
    if (!user) return;

    // Cek saat pertama kali buka
    checkAndTriggerScheduledNotifications(user.id, transactions, summary).then((triggered) => {
      if (triggered.length > 0) {
        setNotifications((prev) => [...triggered, ...prev]);
      }
    });

    // Cek setiap 30 detik untuk memastikan tepat jam 20:00 langsung terpicu
    const interval = setInterval(() => {
      checkAndTriggerScheduledNotifications(user.id, transactions, summary).then((triggered) => {
        if (triggered.length > 0) {
          setNotifications((prev) => [...triggered, ...prev]);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [user, transactions, summary]);

  const handleMarkNotifAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await markNotificationAsRead(id);
  };

  const handleMarkAllNotifAsRead = async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead(user.id);
  };

  const handleTriggerTestNotif = async () => {
    if (!user) return;
    const triggered = await checkAndTriggerScheduledNotifications(user.id, transactions, summary, true);
    if (triggered.length > 0) {
      setNotifications((prev) => [...triggered, ...prev]);
    }
  };

  const togglePrivacy = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('FINFLOW_PRIVACY', String(next));
      return next;
    });
  };

  // Loading Screen Awal saat cek session
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4"
        >
          <Wallet className="w-6 h-6" />
        </motion.div>
        <p className="text-sm font-semibold text-slate-300 animate-pulse">
          Memuat FinFlow Cloud...
        </p>
      </div>
    );
  }

  // Jika pengguna membuka tautan recovery / reset password dari email
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <UpdatePasswordModal onSuccess={() => setIsPasswordRecovery(false)} />
      </div>
    );
  }

  // Jika belum login, tampilkan Auth Page dengan tab Login & Register
  if (!user) {
    return (
      <>
        <AuthPage onOpenConfigModal={() => setIsConfigModalOpen(true)} />
        {isConfigModalOpen && (
          <ConfigModal onClose={() => setIsConfigModalOpen(false)} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 w-full max-w-full overflow-x-hidden pt-safe pb-safe">
      
      {/* Banner Mode Offline */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Mode Offline — Menampilkan data tersimpan di perangkat Anda.</span>
        </div>
      )}

      {/* Navbar Atas */}
      <Navbar
        selectedMonthYear={selectedMonthYear}
        onMonthChange={(m) => setSelectedMonthYear(m)}
        privacyMode={privacyMode}
        onTogglePrivacy={togglePrivacy}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAddModal={() => {
          setIsAddFromSavings(false);
          setIsAddModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        notifications={notifications}
        onMarkNotifAsRead={handleMarkNotifAsRead}
        onMarkAllNotifAsRead={handleMarkAllNotifAsRead}
        onOpenNotifSettings={() => setIsNotifSettingsOpen(true)}
      />

      {/* Main Container - Spasial Lebih Luas di HP agar tidak paspasan frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 pb-24 md:pb-12">
        
        {/* Welcome Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Halo, {profile?.full_name || user.email?.split('@')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Berikut adalah ringkasan kesehatan finansial & alokasi anggaran Anda periode <b>{formatMonthYear(selectedMonthYear)}</b>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              <span>Sisa {summary.days_left_in_month} Hari</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs">
              <Wallet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{wallets.length} Dompet Aktif</span>
            </span>
          </div>
        </div>

        {/* 1. Metric Cards (Total Uang Bulan Ini, Total Tabungan, Total Semua Kas, Limit Hari Ini) */}
        <section>
          <MetricCards
            summary={summary}
            privacyMode={privacyMode}
            walletsCount={wallets.length}
            onOpenWithdrawSavings={() => {
              setAddModalInitialType('expense');
              setIsAddFromSavings(true);
              setIsAddModalOpen(true);
            }}
          />
        </section>

        {/* 2. Multi-Dompet & Rekening (Wallets) */}
        <section>
          <WalletOverviewCard
            wallets={wallets}
            privacyMode={privacyMode}
            onAddWallet={addWallet}
            onDeleteWallet={deleteWallet}
            onUpdateWallet={updateWallet}
            onOpenTransfer={() => {
              setAddModalInitialType('transfer');
              setIsAddFromSavings(false);
              setIsAddModalOpen(true);
            }}
            selectedWalletFilter={selectedWalletFilter}
            onSelectWalletFilter={setSelectedWalletFilter}
          />
        </section>

        {/* 3. Budget Allocation Card (Interactive Sliders & Real-time Nominal Calculation) */}
        <section>
          <BudgetAllocationCard
            budgetSettings={budgetSettings}
            summary={summary}
            onSave={saveBudgetSettings}
            privacyMode={privacyMode}
          />
        </section>

        {/* 4. Tagihan & Pengeluaran Rutin (Recurring Transactions) */}
        <section>
          <RecurringManagerCard
            recurringList={recurringList}
            wallets={wallets}
            categories={categories}
            selectedMonthYear={selectedMonthYear}
            privacyMode={privacyMode}
            onAddRecurring={addRecurring}
            onDeleteRecurring={deleteRecurring}
            onToggleRecurring={toggleRecurring}
            onProcessRecurring={processRecurring}
          />
        </section>

        {/* 5. Kontrol Limit Harian/Mingguan & Smart Alert */}
        <section>
          <SmartLimitControl
            summary={summary}
            privacyMode={privacyMode}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </section>

        {/* 6. Rekomendasi Pintar & Analisis AI (Smart Advisor) */}
        <section>
          <SmartAdvisor
            recommendations={recommendations}
            summary={summary}
          />
        </section>

        {/* 7. Visualisasi Data Beranimasi (Recharts Donut & Bar Chart) */}
        <section>
          <React.Suspense
            fallback={
              <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-xs text-slate-400">
                Memuat visualisasi grafik...
              </div>
            }
          >
            <AnalyticsCharts
              transactions={transactions}
              summary={summary}
              monthlyComparison={monthlyComparison}
              privacyMode={privacyMode}
            />
          </React.Suspense>
        </section>

        {/* 8. Daftar Transaksi & Kategori Kustom */}
        <section>
          <TransactionList
            transactions={transactions}
            wallets={wallets}
            privacyMode={privacyMode}
            onDeleteTransaction={deleteTransaction}
            onOpenAddModal={() => {
              setAddModalInitialType('expense');
              setIsAddFromSavings(false);
              setIsAddModalOpen(true);
            }}
            selectedWalletFilter={selectedWalletFilter}
            onSelectWalletFilter={setSelectedWalletFilter}
          />
        </section>

      </main>

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 md:hidden z-30">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setAddModalInitialType('expense');
            setIsAddFromSavings(false);
            setIsAddModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/40 flex items-center justify-center font-bold"
          title="Tambah Transaksi"
        >
          <PlusCircle className="w-7 h-7" />
        </motion.button>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isPasswordRecovery && (
          <UpdatePasswordModal onSuccess={() => setIsPasswordRecovery(false)} />
        )}

        {isAddModalOpen && (
          <AddTransactionModal
            categories={categories}
            wallets={wallets}
            initialType={addModalInitialType}
            initialIsFromSavings={isAddFromSavings}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={addTransaction}
            onOpenCategoryManager={() => {
              setIsAddModalOpen(false);
              setIsCategoryModalOpen(true);
            }}
          />
        )}

        {isCategoryModalOpen && (
          <CategoryManagerModal
            categories={categories}
            onClose={() => setIsCategoryModalOpen(false)}
            onAddCategory={addCustomCategory}
            onDeleteCategory={deleteCustomCategory}
          />
        )}

        {isExportModalOpen && (
          <React.Suspense fallback={null}>
            <ExportModal
              transactions={transactions}
              summary={summary}
              budgetSettings={budgetSettings}
              monthYear={selectedMonthYear}
              onClose={() => setIsExportModalOpen(false)}
            />
          </React.Suspense>
        )}

        {isConfigModalOpen && (
          <ConfigModal onClose={() => setIsConfigModalOpen(false)} />
        )}

        {isNotifSettingsOpen && (
          <NotificationSettingsModal
            onClose={() => setIsNotifSettingsOpen(false)}
            onTriggerTest={handleTriggerTestNotif}
            summary={summary}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 FinFlow — Personal Finance Tracker. Multi-User Supabase Cloud RLS.</p>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Koneksi Database & SQL Editor
          </button>
        </div>
      </footer>

    </div>
  );
};
