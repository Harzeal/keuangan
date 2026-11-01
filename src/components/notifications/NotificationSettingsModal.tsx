import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Laptop,
  Send,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  showSystemNotification
} from '../../lib/notificationEngine';
import { MonthSummary, Transaction } from '../../types/database';

interface NotificationSettingsModalProps {
  onClose: () => void;
  onTriggerTest: () => Promise<void>;
  summary: MonthSummary;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  onClose,
  onTriggerTest,
  summary
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermissionStatus());
  const [autoDailyEnabled, setAutoDailyEnabled] = useState<boolean>(() => {
    return localStorage.getItem('FINFLOW_NOTIF_DAILY') !== 'false';
  });
  const [testSent, setTestSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      await showSystemNotification('🎉 FinFlow: Izin Notifikasi Aktif!', {
        body: 'Pengingat pengeluaran jam 20:00, rekap Senin, dan akhir bulan akan otomatis muncul di perangkat Anda.'
      });
    }
  };

  const handleToggleDaily = (val: boolean) => {
    setAutoDailyEnabled(val);
    localStorage.setItem('FINFLOW_NOTIF_DAILY', String(val));
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setTestSent(false);

    try {
      if (permission !== 'granted') {
        const granted = await requestNotificationPermission();
        setPermission(granted ? 'granted' : 'denied');
        if (!granted) {
          alert('Harap izinkan notifikasi browser/sistem terlebih dahulu agar pengingat dapat muncul.');
          setLoading(false);
          return;
        }
      }

      await onTriggerTest();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    } catch (err) {
      console.error('Error testing notification:', err);
    } finally {
      setLoading(false);
    }
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
        className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl relative text-slate-800 dark:text-slate-100 overflow-hidden"
      >
        {/* Header di bagian atas dengan tombol silang (tanpa tulisan) */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Pengaturan Notifikasi Pintar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pengingat otomatis jam 20:00, rekap Senin & akhir bulan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Tutup (Esc)"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Izin OS */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            permission === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-3">
              {permission === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold">
                  {permission === 'granted'
                    ? 'Izin Notifikasi Sistem: Aktif (Diizinkan)'
                    : 'Izin Notifikasi Sistem: Belum Diizinkan'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {permission === 'granted'
                    ? 'Notifikasi akan muncul di Windows Action Center & Bar HP'
                    : 'Klik tombol untuk mengizinkan notifikasi di perangkat ini'}
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition shadow-sm"
              >
                Izinkan
              </button>
            )}
          </div>

          {/* Daftar Jadwal Notifikasi */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Jadwal Notifikasi Otomatis
            </h3>

            {/* 1. Harian Jam 20:00 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Notifikasi Harian (Setiap Jam 20:00)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Memberi tahu total pengeluaran Anda hari ini dan sisa batas limit harian yang aman.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={autoDailyEnabled}
                  onChange={(e) => handleToggleDaily(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* 2. Senin: 2 Notifikasi */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Setiap Hari Senin (Dua Notifikasi Jam 20:00)
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    2 Notif
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mengirimkan notifikasi harian Senin + notifikasi rekap total pemakaian uang di minggu sebelumnya (Senin–Minggu lalu).
                </p>
              </div>
            </div>

            {/* 3. Akhir Bulan */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Setiap Akhir Bulan (Tutup Buku Jam 20:00)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Laporan otomatis total uang keluar selama 1 bulan penuh dan rincian alokasi Kebutuhan vs Keinginan.
                </p>
              </div>
            </div>
          </div>

          {/* Tombol Uji Coba / Tes Notifikasi */}
          <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Uji Notifikasi Sekarang</span>
                </h4>
                <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">
                  Klik untuk melihat tampilan banner notifikasi di layar Windows / HP Anda saat ini
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleTestNotification}
                disabled={loading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition shrink-0"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : testSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Terkirim! Cek Layar</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Notifikasi Tes</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Info Kompatibilitas Lintas Platform (.apk, .app, .exe) */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <Laptop className="w-4 h-4 text-purple-500" />
              <span>Sinkronisasi Lintas Platform (.apk / .app / .exe)</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Sistem notifikasi ini menggunakan standar <b>Service Worker & Web Notification API</b> yang tersinkronisasi ke database cloud Supabase. Saat website ini di-convert menjadi <b>.apk (Android)</b>, <b>.app (iOS/macOS)</b>, atau <b>.exe (Windows Desktop)</b>, notifikasi akan langsung terhubung ke sistem notifikasi native perangkat Anda tanpa perlu penulisan ulang!
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
