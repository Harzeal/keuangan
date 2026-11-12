import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  PlusCircle,
  Download,
  Settings,
  LayoutGrid,
  ReceiptText,
  PieChart,
  Sliders,
  Repeat,
  Database,
  Bell,
  FolderPlus,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Menu
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useBudget } from './hooks/useBudget';
import { getCurrentMonthYear } from './lib/utils';

// Components
import { AuthPage } from './components/auth/AuthPage';
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal';
import { Navbar } from './components/common/Navbar';
import { BentoDashboardV24, NavTabId } from './components/dashboard/BentoDashboardV24';
import { CategorySpendingBreakdown } from './components/dashboard/CategorySpendingBreakdown';
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

const NAV_ITEMS: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutGrid },
  { id: 'transactions', label: 'Riwayat', icon: ReceiptText },
  { id: 'categories', label: 'Kategori', icon: PieChart },
  { id: 'wallets', label: 'Dompet', icon: Wallet },
  { id: 'budgets', label: 'Anggaran', icon: Sliders },
  { id: 'recurring', label: 'Rutin', icon: Repeat },
  { id: 'settings', label: 'Setelan', icon: Settings }
];

export const App: React.FC = () => {
  const { user, profile, loading: authLoading, isPasswordRecovery, setIsPasswordRecovery } = useAuth();

  // State Tab Aktif (Menampilkan hanya 1 bagian yang dipilih agar simpel & minimalis)
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');

  // State Tombol Garis Tiga (Buka / Tutup Menu Navigasi)
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);

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
    updateCustomCategory,
    deleteCustomCategory
  } = useBudget(selectedMonthYear);

  // Listener Tombol Back Fisik Android
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (isNavOpen) {
        setIsNavOpen(false);
        return;
      }
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
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
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
  }, [isNavOpen, isAddModalOpen, isCategoryModalOpen, isExportModalOpen, isNotifSettingsOpen, isConfigModalOpen, activeTab]);

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

  // Pemeriksaan jadwal otomatis
  useEffect(() => {
    if (!user) return;

    checkAndTriggerScheduledNotifications(user.id, transactions, summary).then((triggered) => {
      if (triggered.length > 0) {
        setNotifications((prev) => [...triggered, ...prev]);
      }
    });

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

  const openAddModalWithConfig = (
    type: 'income' | 'expense' | 'transfer' = 'expense',
    fromSavings: boolean = false
  ) => {
    setAddModalInitialType(type);
    setIsAddFromSavings(fromSavings);
    setIsAddModalOpen(true);
  };

  // Loading Screen Awal saat cek session
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#113932] text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3"
        >
          <Wallet className="w-5 h-5" />
        </motion.div>
        <p className="text-xs font-semibold text-emerald-100 animate-pulse">
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

  const userDisplayName = profile?.full_name || user.email?.split('@')[0] || 'Pengguna';

  return (
    <div className="min-h-screen bg-[#F3F6F5] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 w-full max-w-full overflow-x-hidden pt-safe pb-safe">
      {/* Banner Mode Offline */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold py-1.5 px-3 text-center flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Mode Offline — Menampilkan data tersimpan di perangkat Anda.</span>
        </div>
      )}

      {/* Navbar Atas (Dengan tombol Garis Tiga khusus HP di dalam Header) */}
      <Navbar
        selectedMonthYear={selectedMonthYear}
        onMonthChange={(m) => setSelectedMonthYear(m)}
        privacyMode={privacyMode}
        onTogglePrivacy={togglePrivacy}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAddModal={() => openAddModalWithConfig('expense', false)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        notifications={notifications}
        onMarkNotifAsRead={handleMarkNotifAsRead}
        onMarkAllNotifAsRead={handleMarkAllNotifAsRead}
        onOpenNotifSettings={() => setIsNotifSettingsOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* =====================================================================
          FLOATING COLLAPSIBLE NAVIGATION ("GARIS TIGA") — KHUSUS PC, LAPTOP, TABLET (md+)
          - Di HP (< md), tombol Garis Tiga berada tetap di dalam Header (Navbar)
         ===================================================================== */}
      <motion.aside
        layout
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="hidden md:flex fixed left-4 top-24 z-50 flex-col items-center rounded-3xl bg-[#113932]/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/15 dark:border-slate-700/80 text-white shadow-2xl p-2 w-16"
      >
        {/* Tombol Garis Tiga (Toggle Buka / Mengecil Kembali) */}
        <button
          type="button"
          onClick={() => setIsNavOpen((prev) => !prev)}
          className={`w-12 h-11 rounded-2xl flex items-center justify-center transition-all ${
            isNavOpen
              ? 'bg-white/15 text-emerald-300'
              : 'bg-[#10B981] text-white shadow-md shadow-emerald-500/25 hover:scale-105'
          }`}
          title={isNavOpen ? 'Kecilkan Menu' : 'Buka Menu Navigasi'}
        >
          <Menu className="w-5 h-5 stroke-[2.4]" />
        </button>

        {/* Daftar Menu Saat Garis Tiga Dipencet */}
        <AnimatePresence initial={false}>
          {isNavOpen && (
            <motion.div
              key="nav-items"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden w-full flex flex-col items-center gap-1.5 pt-2 mt-1.5 border-t border-white/10 max-h-[calc(100vh-9rem)] overflow-y-auto scrollbar-none"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsNavOpen(false);
                    }}
                    className={`w-full py-2 px-0.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                      isActive
                        ? 'bg-[#10B981] text-white shadow-md shadow-emerald-500/25 font-bold'
                        : 'text-emerald-100/75 hover:text-white hover:bg-white/10'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span className="text-[9.5px] tracking-tight leading-none truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}

              {/* Tombol Oranye + Catat Transaksi */}
              <button
                type="button"
                onClick={() => {
                  setIsNavOpen(false);
                  openAddModalWithConfig('expense', false);
                }}
                className="mt-1 w-11 h-11 rounded-2xl bg-[#F97316] hover:bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/30 transition transform hover:scale-105 shrink-0"
                title="Catat Transaksi Baru"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* MAIN CONTENT AREA (Full width di HP, menyesuaikan ruang sidebar di PC/Laptop/Tablet) */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-3 md:pl-24 md:pr-6 lg:px-8 py-3 sm:py-6 pb-10">
        <main className="w-full min-w-0">
          <AnimatePresence mode="wait">
            {/* 1. TAB BERANDA: 3-ZONE BENTO GRID V24 */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <BentoDashboardV24
                  userDisplayName={userDisplayName}
                  selectedMonthYear={selectedMonthYear}
                  onMonthChange={setSelectedMonthYear}
                  summary={summary}
                  budgetSettings={budgetSettings}
                  wallets={wallets}
                  transactions={transactions}
                  monthlyComparison={monthlyComparison}
                  recommendations={recommendations}
                  privacyMode={privacyMode}
                  onOpenAddModal={openAddModalWithConfig}
                  onNavigateTab={setActiveTab}
                  selectedWalletFilter={selectedWalletFilter}
                  onSelectWalletFilter={(w) => {
                    setSelectedWalletFilter(w);
                    if (w) setActiveTab('transactions');
                  }}
                />
              </motion.div>
            )}

            {/* 2. TAB RIWAYAT: HANYA MENAMPILKAN SELURUH RIWAYAT TRANSAKSI */}
            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <TransactionList
                  transactions={transactions}
                  wallets={wallets}
                  privacyMode={privacyMode}
                  onDeleteTransaction={deleteTransaction}
                  onOpenAddModal={() => openAddModalWithConfig('expense', false)}
                  selectedWalletFilter={selectedWalletFilter}
                  onSelectWalletFilter={setSelectedWalletFilter}
                />
              </motion.div>
            )}

            {/* 3. TAB KATEGORI & ANALITIK: PERSENTASE & TOTAL UANG HABIS PER KATEGORI + GRAFIK */}
            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 sm:space-y-6"
              >
                <CategorySpendingBreakdown
                  transactions={transactions}
                  summary={summary}
                  privacyMode={privacyMode}
                  compact={false}
                  onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
                />

                <React.Suspense
                  fallback={
                    <div className="h-52 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 animate-pulse flex items-center justify-center text-xs text-slate-400">
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

                <SmartAdvisor
                  recommendations={recommendations}
                  summary={summary}
                />
              </motion.div>
            )}

            {/* 4. TAB DOMPET: HANYA MENAMPILKAN DOMPET & REKENING */}
            {activeTab === 'wallets' && (
              <motion.div
                key="wallets"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <WalletOverviewCard
                  wallets={wallets}
                  privacyMode={privacyMode}
                  onAddWallet={addWallet}
                  onDeleteWallet={deleteWallet}
                  onUpdateWallet={updateWallet}
                  onOpenTransfer={() => openAddModalWithConfig('transfer', false)}
                  selectedWalletFilter={selectedWalletFilter}
                  onSelectWalletFilter={(w) => {
                    setSelectedWalletFilter(w);
                    if (w) setActiveTab('transactions');
                  }}
                />
              </motion.div>
            )}

            {/* 5. TAB ANGGARAN: HANYA MENAMPILKAN ALOKASI 50/20/30 & KONTROL LIMIT */}
            {activeTab === 'budgets' && (
              <motion.div
                key="budgets"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 sm:space-y-6"
              >
                <BudgetAllocationCard
                  budgetSettings={budgetSettings}
                  summary={summary}
                  onSave={saveBudgetSettings}
                  privacyMode={privacyMode}
                />

                <SmartLimitControl
                  summary={summary}
                  privacyMode={privacyMode}
                  onOpenAddModal={() => openAddModalWithConfig('expense', false)}
                />
              </motion.div>
            )}

            {/* 6. TAB RUTIN: HANYA MENAMPILKAN TAGIHAN & PENGELUARAN RUTIN */}
            {activeTab === 'recurring' && (
              <motion.div
                key="recurring"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
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
              </motion.div>
            )}

            {/* 7. TAB PENGATURAN: HANYA MENAMPILKAN MENU PENGATURAN & UTILITAS */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-6"
              >
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Pengaturan & Utilitas Aplikasi
                  </h2>
                  <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Kelola kategori kustom, laporan PDF/Excel, preferensi privasi, dan koneksi database
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                      <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Kelola Kategori Kustom
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tambah atau hapus kategori pengeluaran & pemasukan sesuai kebutuhan Anda.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Ekspor Laporan PDF & CSV
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Unduh laporan pembukuan bulanan dalam format PDF siap cetak atau Excel.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNotifSettingsOpen(true)}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Pengingat & Notifikasi
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Atur jadwal pengingat harian jam 20:00 dan evaluasi mingguan/bulanan.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={togglePrivacy}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                      {privacyMode ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Mode Privasi: {privacyMode ? 'Aktif' : 'Nonaktif'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Sembunyikan nominal saldo dengan sensor bintang saat berada di tempat umum.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                      {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Tema Tampilan: {darkMode ? 'Mode Gelap' : 'Mode Terang'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ganti suasana antarmuka antara palet terang Bento V24 atau mode malam.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(true)}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                      <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Koneksi Cloud & SQL
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Periksa status sinkronisasi Supabase Cloud RLS dan skema tabel database.
                    </p>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
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
            onUpdateCategory={updateCustomCategory}
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
    </div>
  );
};
