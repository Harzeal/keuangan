import { supabase } from './supabase';
import { AppNotification, NotificationType, Transaction, MonthSummary } from '../types/database';
import { formatRupiah, formatMonthYear, getMonthDaysInfo } from './utils';

// Helper Service Worker registration
let swRegistration: ServiceWorkerRegistration | null = null;

export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Gagal mendaftarkan Service Worker:', err);
    return null;
  }
}

/**
 * Cek status izin notifikasi sistem OS (Windows / Android / iOS / Mac)
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Minta izin notifikasi ke pengguna
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.error('Error saat meminta izin notifikasi:', err);
    return false;
  }
}

/**
 * Kirim notifikasi sistem ke OS (tampil di Windows Action Center / Android Notification Bar)
 * Kompatibel langsung dengan PWA, Web, Capacitor (.apk/.app), dan Electron (.exe)
 */
export async function showSystemNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const notificationOptions = {
    body: options.body,
    icon: options.icon || '/icon.svg',
    badge: '/icon.svg',
    tag: options.tag,
    data: options.data,
    vibrate: [200, 100, 200] as any,
    requireInteraction: false
  };

  // 1. Coba lewat Service Worker Registration (Rekomendasi PWA / Android)
  if (swRegistration && 'showNotification' in swRegistration) {
    try {
      await swRegistration.showNotification(title, notificationOptions);
      return;
    } catch (e) {
      console.warn('Fallback ke window.Notification:', e);
    }
  }

  // 2. Fallback ke Web Notification standar
  try {
    new Notification(title, notificationOptions);
  } catch (err) {
    console.warn('Gagal memicu Notification:', err);
  }
}

/**
 * Simpan notifikasi ke Supabase dan localStorage agar tersinkronisasi lintas perangkat (.apk, .exe, web)
 */
export async function persistNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    type: NotificationType;
    reference_date: string;
    metadata?: Record<string, any>;
  }
): Promise<AppNotification | null> {
  // Simpan key deduplikasi di localStorage
  const localKey = `NOTIF_SENT_${userId}_${notification.type}_${notification.reference_date}`;
  localStorage.setItem(localKey, new Date().toISOString());

  const newRecord: Partial<AppNotification> = {
    user_id: userId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    reference_date: notification.reference_date,
    is_read: false,
    metadata: notification.metadata || {},
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .upsert(newRecord, { onConflict: 'user_id,type,reference_date' })
      .select()
      .single();

    if (!error && data) {
      return data as AppNotification;
    }
  } catch (err) {
    console.warn('Supabase user_notifications belum ada atau offline:', err);
  }

  // Fallback local memory object
  return {
    id: `local_${Date.now()}`,
    ...newRecord
  } as AppNotification;
}

/**
 * Cek apakah notifikasi untuk tanggal/periode ini sudah pernah dikirim ke user
 */
export async function hasNotificationBeenSent(
  userId: string,
  type: NotificationType,
  referenceDate: string
): Promise<boolean> {
  const localKey = `NOTIF_SENT_${userId}_${type}_${referenceDate}`;
  if (localStorage.getItem(localKey)) {
    return true;
  }

  try {
    const { data } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('reference_date', referenceDate)
      .maybeSingle();

    if (data) {
      localStorage.setItem(localKey, 'true');
      return true;
    }
  } catch {
    // abaikan jika tabel belum ada
  }

  return false;
}

/**
 * Helper: Ambil rentang tanggal Senin - Minggu minggu sebelumnya
 */
function getPreviousWeekRange(): { startStr: string; endStr: string; weekLabel: string } {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  // Senin minggu ini
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysSinceMonday);

  // Minggu minggu lalu = thisMonday - 1 day
  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);

  // Senin minggu lalu = prevSunday - 6 days
  const prevMonday = new Date(prevSunday);
  prevMonday.setDate(prevSunday.getDate() - 6);

  const startStr = prevMonday.toISOString().split('T')[0];
  const endStr = prevSunday.toISOString().split('T')[0];

  const weekNum = Math.ceil((((prevMonday as any) - (new Date(prevMonday.getFullYear(), 0, 1) as any)) / 86400000 + 1) / 7);
  const weekLabel = `${prevMonday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  return { startStr, endStr, weekLabel };
}

/**
 * EKSEKUSI CEK JADWAL NOTIFIKASI OTOMATIS:
 * 1. Setiap hari jam 20.00: Notifikasi jumlah uang yang dikeluarkan hari ini
 * 2. Setiap hari Senin jam 20.00: Dua notifikasi (Notifikasi harian + Notifikasi total pemakaian minggu sebelumnya)
 * 3. Setiap akhir bulan jam 20.00: Notifikasi total pengeluaran bulan tersebut
 */
export async function checkAndTriggerScheduledNotifications(
  userId: string,
  transactions: Transaction[],
  summary: MonthSummary,
  forceTest: boolean = false
): Promise<AppNotification[]> {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday

  // Notifikasi aktif jika sudah jam 20.00 atau lebih (20:00 - 23:59), atau saat forceTest
  const isTimeForNotification = forceTest || currentHour >= 20;

  if (!isTimeForNotification) {
    return [];
  }

  const triggered: AppNotification[] = [];

  // =========================================================================
  // 1. NOTIFIKASI HARIAN (JAM 20:00)
  // =========================================================================
  const alreadySentDaily = await hasNotificationBeenSent(userId, 'daily', todayStr);
  if (!alreadySentDaily || forceTest) {
    const todayExpenses = transactions
      .filter((t) => t.date === todayStr && t.type === 'expense' && t.main_category !== 'savings')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remainingLimit = summary.daily_limit - todayExpenses;
    const title = '💰 Rekap Pengeluaran Hari Ini (20:00)';
    let body = `Hari ini Anda telah mengeluarkan ${formatRupiah(todayExpenses)}.`;

    if (summary.daily_limit > 0) {
      if (remainingLimit >= 0) {
        body += ` Sisa kuota limit hari ini: ${formatRupiah(remainingLimit)}. Kerja bagus!`;
      } else {
        body += ` Melebihi limit harian sebesar ${formatRupiah(Math.abs(remainingLimit))}. Perhatikan pengeluaran esok hari!`;
      }
    }

    await showSystemNotification(title, {
      body,
      tag: `finflow-daily-${todayStr}`
    });

    const notif = await persistNotification(userId, {
      title,
      body,
      type: 'daily',
      reference_date: todayStr,
      metadata: { spent: todayExpenses, remaining: remainingLimit }
    });

    if (notif) triggered.push(notif);
  }

  // =========================================================================
  // 2. SETIAP HARI SENIN (JAM 20:00) -> NOTIFIKASI KEDUA: REKAP MINGGU SEBELUMNYA
  // =========================================================================
  if (dayOfWeek === 1 || forceTest) {
    const { startStr, endStr, weekLabel } = getPreviousWeekRange();
    const alreadySentWeekly = await hasNotificationBeenSent(userId, 'weekly', weekLabel);

    if (!alreadySentWeekly || forceTest) {
      // Hitung pengeluaran dari Senin minggu lalu s/d Minggu minggu lalu
      const prevWeekExpenses = transactions
        .filter((t) => t.date >= startStr && t.date <= endStr && t.type === 'expense' && t.main_category !== 'savings')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const title = '📊 Rekap Pengeluaran Minggu Lalu (Senin)';
      let body = `Total pemakaian uang Anda di minggu sebelumnya adalah ${formatRupiah(prevWeekExpenses)}.`;

      if (summary.weekly_limit > 0) {
        const gap = summary.weekly_limit - prevWeekExpenses;
        if (gap >= 0) {
          body += ` Hemat ${formatRupiah(gap)} dari batas target mingguan!`;
        } else {
          body += ` Melebihi target mingguan sebesar ${formatRupiah(Math.abs(gap))}.`;
        }
      }

      // Beri sedikit jeda agar 2 notifikasi tidak tumpang tindih
      setTimeout(async () => {
        await showSystemNotification(title, {
          body,
          tag: `finflow-weekly-${weekLabel}`
        });
      }, 1000);

      const notif = await persistNotification(userId, {
        title,
        body,
        type: 'weekly',
        reference_date: weekLabel,
        metadata: { spent: prevWeekExpenses, range: `${startStr} s/d ${endStr}` }
      });

      if (notif) triggered.push(notif);
    }
  }

  // =========================================================================
  // 3. SETIAP AKHIR BULAN (JAM 20:00) -> NOTIFIKASI TOTAL UANG KELUAR BULAN INI
  // =========================================================================
  const { totalDays, currentDay } = getMonthDaysInfo(summary.month_year);
  const isLastDayOfMonth = currentDay === totalDays;

  if (isLastDayOfMonth || forceTest) {
    const monthKey = summary.month_year;
    const alreadySentMonthly = await hasNotificationBeenSent(userId, 'monthly', monthKey);

    if (!alreadySentMonthly || forceTest) {
      const monthExpenses = summary.total_expense;
      const periodLabel = formatMonthYear(monthKey);
      const title = `🗓️ Rekap Pengeluaran Akhir Bulan (${periodLabel})`;
      const body = `Tutup buku bulan ${periodLabel}: Total pengeluaran Anda adalah ${formatRupiah(monthExpenses)}. Kebutuhan: ${formatRupiah(summary.needs_expense)}, Keinginan: ${formatRupiah(summary.wants_expense)}.`;

      setTimeout(async () => {
        await showSystemNotification(title, {
          body,
          tag: `finflow-monthly-${monthKey}`
        });
      }, 2000);

      const notif = await persistNotification(userId, {
        title,
        body,
        type: 'monthly',
        reference_date: monthKey,
        metadata: {
          totalExpense: monthExpenses,
          needs: summary.needs_expense,
          wants: summary.wants_expense,
          savings: summary.savings_allocated
        }
      });

      if (notif) triggered.push(notif);
    }
  }

  return triggered;
}

/**
 * Ambil riwayat notifikasi user dari Supabase
 */
export async function fetchUserNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      return data as AppNotification[];
    }
  } catch (err) {
    console.warn('Gagal fetch user_notifications:', err);
  }

  return [];
}

/**
 * Tandai notifikasi sebagai sudah dibaca
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', id);
  } catch (err) {
    console.warn('Gagal mark notification as read:', err);
  }
}

/**
 * Tandai seluruh notifikasi user sebagai sudah dibaca
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  } catch (err) {
    console.warn('Gagal mark all notifications as read:', err);
  }
}
