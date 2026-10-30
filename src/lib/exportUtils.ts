import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, MonthSummary, BudgetSettings } from '../types/database';
import { formatRupiah, formatIndoDate, formatMonthYear } from './utils';

/**
 * Ekspor data transaksi ke file CSV (Kompatibel dengan Microsoft Excel)
 */
export function exportToCSV(
  transactions: Transaction[],
  summary: MonthSummary,
  monthYear: string,
  userName: string = 'Pengguna'
) {
  const period = formatMonthYear(monthYear);
  const rows: string[][] = [];

  // Header Ringkasan
  rows.push(['LAPORAN KEUANGAN PRIBADI - FINFLOW']);
  rows.push([`Periode: ${period}`]);
  rows.push([`Nama Pengguna: ${userName}`]);
  rows.push([`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`]);
  rows.push([]);
  rows.push(['RINGKASAN ANGGARAN & PENGELUARAN']);
  rows.push(['Total Pemasukan', `${summary.income}`]);
  rows.push(['Total Pengeluaran', `${summary.total_expense}`]);
  rows.push(['Alokasi Kebutuhan (Needs)', `${summary.needs_expense}`]);
  rows.push(['Alokasi Keinginan (Wants)', `${summary.wants_expense}`]);
  rows.push(['Alokasi Tabungan/Investasi', `${summary.savings_allocated}`]);
  rows.push(['Sisa Anggaran Bulanan', `${summary.remaining_total_budget}`]);
  rows.push([]);
  rows.push(['DAFTAR TRANSAKSI']);
  rows.push(['No', 'Tanggal', 'Tipe', 'Alokasi Utama', 'Kategori', 'Nominal (IDR)', 'Keterangan']);

  // Daftar Transaksi
  transactions.forEach((tx, index) => {
    const mainCategoryLabel =
      tx.main_category === 'needs'
        ? 'Kebutuhan'
        : tx.main_category === 'wants'
        ? 'Keinginan'
        : tx.main_category === 'savings'
        ? 'Tabungan'
        : 'Pemasukan';

    const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

    rows.push([
      (index + 1).toString(),
      tx.date,
      typeLabel,
      mainCategoryLabel,
      `"${tx.category_name.replace(/"/g, '""')}"`,
      tx.amount.toString(),
      `"${(tx.title || '').replace(/"/g, '""')}"`
    ]);
  });

  const csvContent = '\uFEFF' + rows.map(e => e.join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Keuangan_${monthYear}_${userName.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Ekspor data keuangan ke Dokumen PDF Resmi & Rapi
 */
export function exportToPDF(
  transactions: Transaction[],
  summary: MonthSummary,
  budget: BudgetSettings,
  monthYear: string,
  userName: string = 'Pengguna'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const period = formatMonthYear(monthYear);

  // 1. Header Banner
  doc.setFillColor(79, 70, 229); // Brand Indigo
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FinFlow — Laporan Keuangan', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${period}  |  Pengguna: ${userName}`, 14, 27);
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 150, 27);

  // 2. Ringkasan Metrik Finansial
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Alokasi & Arus Kas', 14, 46);

  const summaryData = [
    ['Pemasukan Bulan Ini', formatRupiah(summary.income), 'Target Kebutuhan (Needs)', `${budget.needs_percentage}% (${formatRupiah(summary.budget_needs)})`],
    ['Total Pengeluaran', formatRupiah(summary.total_expense), 'Target Keinginan (Wants)', `${budget.wants_percentage}% (${formatRupiah(summary.budget_wants)})`],
    ['Sisa Saldo Kas', formatRupiah(summary.income - summary.total_expense), 'Target Tabungan (Savings)', `${budget.savings_percentage}% (${formatRupiah(summary.budget_savings)})`],
    ['Sisa Anggaran Belanja', formatRupiah(summary.remaining_total_budget), 'Rasio Menabung Realisasi', `${summary.savings_rate_percent.toFixed(1)}%`]
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Indikator Kas', 'Nominal', 'Alokasi Pagu Anggaran', 'Target & Nominal']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { fontStyle: 'bold' }
    }
  });

  // 3. Tabel Detail Transaksi
  const finalY = (doc as any).lastAutoTable.finalY || 95;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Rincian Transaksi Bulanan', 14, finalY + 10);

  const txRows = transactions.map((tx, idx) => {
    const mainCategoryLabel =
      tx.main_category === 'needs'
        ? 'Kebutuhan'
        : tx.main_category === 'wants'
        ? 'Keinginan'
        : tx.main_category === 'savings'
        ? 'Tabungan'
        : 'Pemasukan';

    const formattedAmount = (tx.type === 'income' ? '+ ' : '- ') + formatRupiah(tx.amount);

    return [
      (idx + 1).toString(),
      formatIndoDate(tx.date),
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      mainCategoryLabel,
      tx.category_name,
      tx.title || '-',
      formattedAmount
    ];
  });

  autoTable(doc, {
    startY: finalY + 14,
    head: [['No', 'Tanggal', 'Tipe', 'Alokasi', 'Kategori', 'Keterangan', 'Nominal']],
    body: txRows.length > 0 ? txRows : [['-', '-', '-', '-', '-', 'Belum ada data transaksi', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 32 },
      5: { cellWidth: 46 },
      6: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = data.cell.text[0] || '';
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose
        }
      }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${pageCount}  •  Dibuat secara otomatis oleh FinFlow Finance Tracker`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`FinFlow_Laporan_${monthYear}_${userName.replace(/\s+/g, '_')}.pdf`);
}
