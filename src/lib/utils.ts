import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke mata uang Rupiah
 * Contoh: 5000000 -> "Rp 5.000.000"
 */
export function formatRupiah(amount: number, withPrefix: boolean = true): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toLocaleString('id-ID');
  
  if (!withPrefix) {
    return isNegative ? `-${formatted}` : formatted;
  }
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Ubah string format Rupiah/angka ke integer murni
 */
export function parseRupiahInput(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '');
  return cleaned === '' ? 0 : parseInt(cleaned, 10);
}

/**
 * Konversi angka ke kalimat terbilang Bahasa Indonesia
 * Contoh: 25000 -> "Dua puluh lima ribu rupiah"
 */
export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return 'Nol rupiah';

  const angka = Math.abs(Math.floor(n));
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  function toWords(num: number): string {
    if (num < 12) {
      return bilangan[num];
    } else if (num < 20) {
      return bilangan[num - 10] + ' Belas';
    } else if (num < 100) {
      const sisa = num % 10;
      return bilangan[Math.floor(num / 10)] + ' Puluh' + (sisa ? ' ' + bilangan[sisa] : '');
    } else if (num < 200) {
      return 'Seratus' + (num - 100 ? ' ' + toWords(num - 100) : '');
    } else if (num < 1000) {
      const sisa = num % 100;
      return bilangan[Math.floor(num / 100)] + ' Ratus' + (sisa ? ' ' + toWords(sisa) : '');
    } else if (num < 2000) {
      return 'Seribu' + (num - 1000 ? ' ' + toWords(num - 1000) : '');
    } else if (num < 1000000) {
      const sisa = num % 1000;
      return toWords(Math.floor(num / 1000)) + ' Ribu' + (sisa ? ' ' + toWords(sisa) : '');
    } else if (num < 1000000000) {
      const sisa = num % 1000000;
      return toWords(Math.floor(num / 1000000)) + ' Juta' + (sisa ? ' ' + toWords(sisa) : '');
    } else if (num < 1000000000000) {
      const sisa = num % 1000000000;
      return toWords(Math.floor(num / 1000000000)) + ' Miliar' + (sisa ? ' ' + toWords(sisa) : '');
    } else {
      const sisa = num % 1000000000000;
      return toWords(Math.floor(num / 1000000000000)) + ' Triliun' + (sisa ? ' ' + toWords(sisa) : '');
    }
  }

  const result = toWords(angka) + ' Rupiah';
  return (n < 0 ? 'Minus ' : '') + result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Format tanggal ke nama bulan & hari Indonesia
 */
export function formatIndoDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const today = new Date();
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = 
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isToday) return 'Hari Ini';
      if (isYesterday) return 'Kemarin';

      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Format bulan 'YYYY-MM' ke nama bulan Indonesia
 * Contoh: '2026-10' -> 'Oktober 2026'
 */
export function formatMonthYear(monthYearStr: string): string {
  try {
    const [year, month] = monthYearStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  } catch {
    return monthYearStr;
  }
}

/**
 * Dapatkan string 'YYYY-MM' saat ini
 */
export function getCurrentMonthYear(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Hitung jumlah total hari dan sisa hari dalam bulan tertentu
 */
export function getMonthDaysInfo(monthYearStr: string): { totalDays: number; currentDay: number; daysLeft: number } {
  const [yearStr, monthStr] = monthYearStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Total hari dalam bulan
  const totalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;

  let currentDay = 1;
  let daysLeft = 1;

  if (isCurrentMonth) {
    currentDay = today.getDate();
    // Sisa hari termasuk hari ini
    daysLeft = Math.max(1, totalDays - currentDay + 1);
  } else if (new Date(year, month - 1, 1) < today) {
    // Bulan yang sudah lewat
    currentDay = totalDays;
    daysLeft = 1;
  } else {
    // Bulan di masa depan
    currentDay = 1;
    daysLeft = totalDays;
  }

  return { totalDays, currentDay, daysLeft };
}

/**
 * Hitung status smart alert berdasarkan persentase
 */
export function getAlertStatus(spent: number, limit: number): 'safe' | 'warning' | 'danger' {
  if (limit <= 0) return 'danger';
  const ratio = spent / limit;
  if (ratio >= 1.0) return 'danger';
  if (ratio >= 0.8) return 'warning';
  return 'safe';
}
