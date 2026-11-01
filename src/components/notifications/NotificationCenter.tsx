import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCheck,
  Settings,
  X,
  Trash2,
  Inbox,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { AppNotification } from '../../types/database';
import { formatIndoDate } from '../../lib/utils';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onOpenSettings: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Tutup panel ketika pengguna menekan tombol ESC di keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const displayList = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="relative">
      
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Pusat Notifikasi & Pengingat"
        className="relative p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute -right-12 sm:right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 divide-y divide-slate-100 dark:divide-slate-800/80"
            >
              
              {/* Header */}
              <div className="pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Notifikasi FinFlow
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {unreadCount} baru
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      title="Tandai semua sudah dibaca"
                      className="p-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenSettings();
                    }}
                    title="Pengaturan Notifikasi"
                    className="p-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    title="Tutup Panel Notifikasi (Esc)"
                    className="p-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="py-2 flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === 'all'
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === 'unread'
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Belum Dibaca ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="py-2 max-h-80 overflow-y-auto space-y-2 pr-1">
                {displayList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <Inbox className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-xs">
                      {filter === 'unread' ? 'Semua notifikasi sudah dibaca!' : 'Belum ada notifikasi tersimpan.'}
                    </p>
                  </div>
                ) : (
                  displayList.map((notif) => {
                    const iconConfig = {
                      daily: {
                        icon: Clock,
                        color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                      },
                      weekly: {
                        icon: Calendar,
                        color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                      },
                      monthly: {
                        icon: ShieldCheck,
                        color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      },
                      alert: {
                        icon: AlertTriangle,
                        color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      },
                      system: {
                        icon: Bell,
                        color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      }
                    }[notif.type] || {
                      icon: Bell,
                      color: 'bg-slate-100 text-slate-600'
                    };

                    const Icon = iconConfig.icon;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.is_read) onMarkAsRead(notif.id);
                        }}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-start gap-3 relative ${
                          notif.is_read
                            ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-white dark:bg-slate-800 border-brand-200 dark:border-brand-800/80 shadow-sm text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconConfig.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold truncate">
                              {notif.title}
                            </h4>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-2 text-slate-600 dark:text-slate-300">
                            {notif.body}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {notif.created_at ? formatIndoDate(notif.created_at.split('T')[0]) : 'Hari ini'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Atur Jam 20:00 & Uji Notifikasi</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
