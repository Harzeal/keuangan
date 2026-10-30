# 💰 FinFlow — Aplikasi Pengelolaan Keuangan Pribadi & Smart Budget Tracker (Supabase Multi-User)

Aplikasi web pencatat dan pengelola keuangan pribadi (*personal finance tracker*) berbasis **React (Vite)**, **Framer Motion**, dan **Tailwind CSS**, yang terintegrasi secara *real-time* dengan cloud database & autentikasi **Supabase**. Dilengkapi alokasi anggaran 50/20/30, kontrol limit harian/mingguan otomatis, indikator *smart alert* (perubahan warna/glowing), rekomendasi AI/algoritma finansial cerdas, visualisasi data interaktif, dan ekspor laporan ke format **PDF resmi** serta **Excel / CSV**.

Aplikasi mendukung **Multi-User** penuh dengan **Row Level Security (RLS)** — setiap data transaksi, anggaran, dan kategori pengguna dienkripsi serta diisolasi aman dan hanya bisa diakses oleh akun masing-masing.

---

## ✨ Fitur-Fitur Utama

1. **Autentikasi Multi-User & Keamanan Cloud Supabase:**
   - Halaman Login & Register dengan animasi transisi tab yang halus (*Framer Motion*).
   - Fitur Lupa Password / Reset Password dengan alur pengiriman email verifikasi dari Supabase.
   - Manajemen sesi (*Session Handling*) otomatis dan profil pengguna.
   - Row Level Security (RLS) pada tabel `profiles`, `budget_settings`, `categories`, dan `transactions`.

2. **Dashboard & Alokasi Anggaran Real-Time (Aturan 50/20/30 & Kustom):**
   - Input pendapatan bulanan dengan efek counter animasi angka berjalan (*Animated Counter*).
   - Slider pengaturan persentase alokasi pos: **Kebutuhan (50%)**, **Keinginan (20%)**, dan **Tabungan / Investasi (30%)** atau kustom.
   - Kalkulasi nominal Rupiah real-time untuk tiap pos anggaran.
   - 4 Kartu Metrik Utama: Saldo Bersih Kas, Sisa Anggaran Bulanan, Sisa Limit Hari Ini, dan Sisa Limit Minggu Ini.
   - *Mode Privasi (Privacy Eye)*: Sembunyikan nominal saldo saat berada di tempat umum atau membuka layar di depan orang lain.

3. **Kontrol Limit Harian/Mingguan & Smart Alert Visual:**
   - Penghitungan otomatis batas belanja aman per hari dan per minggu dari sisa anggaran dibagi sisa hari dalam bulan.
   - **Smart Alert Indicator**: Perubahan warna UI dan lencana glowing:
     - 🟢 **Aman**: Pengeluaran masih di bawah 80% limit.
     - 🟡 **Waspada (Warning)**: Pengeluaran mencapai 80% - 99% dari limit harian/mingguan.
     - 🔴 **Bahaya (Danger / Overbudget)**: Pengeluaran melampaui limit dengan efek glowing pulsasi merah dan pesan peringatan taktis.

4. **Pencatatan Keuangan & Kategori Kustom:**
   - Modal pop-up tambah transaksi dengan animasi slide-in & fade-in.
   - Pratinjau otomatis kalimat terbilang bahasa Indonesia (*"Lima puluh ribu rupiah"*).
   - Tombol nominal instan (+10 rb, +25 rb, +50 rb, +100 rb, +250 rb, +500 rb, +1 Jt).
   - Pengguna dapat menambah dan mengelola **sub-kategori kustom** sendiri (tersimpan aman ke Supabase).
   - Efek perayaan (*confetti celebration*) saat mencatat pemasukan atau tabungan!

5. **Rekomendasi Pintar & Analisis AI Finansial (Smart Advisor):**
   - **Skor Kesehatan Finansial (Health Score 0-100)** berbasis rasio belanja vs tabungan.
   - Rekomendasi otomatis jika pos keinginan melebihi batas, tips tabungan (*Pay Yourself First*), dan deteksi kategori belanja paling boros.

6. **Visualisasi Data Beranimasi & Ekspor Laporan:**
   - **Animated Donut Chart (Recharts)**: Distribusi belanja pos 50/20/30 dan per sub-kategori pengeluaran.
   - **Animated Bar Chart (Recharts)**: Komparasi arus kas multi-bulan (pemasukan vs pengeluaran vs tabungan).
   - **Ekspor Dokumen PDF**: Laporan keuangan resmi, rapi, dengan tabel ringkasan metrik dan rincian transaksi berhalaman.
   - **Ekspor Excel / CSV**: Kompatibel dengan spreadsheet Windows Excel (BOM UTF-8).

---

## 🛠️ Stack Teknologi

- **Frontend Framework**: React 18 (Vite) + TypeScript
- **Animasi & Interaksi**: Framer Motion & Canvas Confetti
- **Styling**: Tailwind CSS (Dark Mode & Light Mode support)
- **Charts & Visualisasi**: Recharts (SVG-based reactive charts)
- **Backend & Auth Engine**: Supabase JS SDK (`@supabase/supabase-js`)
- **Database**: PostgreSQL dengan Row Level Security (RLS)
- **Ekspor Laporan**: jsPDF & jsPDF-AutoTable

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat
Pastikan Node.js (v18+) sudah terpasang di komputer Anda.

### 2. Jalankan Server Dev Vite
Buka terminal (PowerShell atau Command Prompt) di folder `e:\Fauzan\keuangan`:

```bash
npm run dev
```

Aplikasi akan otomatis terbuka di browser pada alamat:
👉 `http://localhost:3000`

---

## 🗄️ Menyiapkan Skema Database Supabase (Hanya 1 Kali)

1. Buka dashboard Supabase proyek Anda:
   👉 **[Supabase SQL Editor](https://supabase.com/dashboard/project/sxwnweslamgdegmjsznm/sql/new)**
2. Buka file [`supabase_schema.sql`](supabase_schema.sql) di folder proyek ini.
3. Salin (*copy*) seluruh isi kodenya, lalu tempel (*paste*) ke dalam SQL Editor Supabase.
4. Klik tombol hijau **RUN**.
5. Selesai! Skema tabel `profiles`, `budget_settings`, `categories`, `transactions`, RLS policies, dan trigger otomatis pendaftaran pengguna baru telah aktif.

---

## 🌐 Menghosting / Mengonlinekan Web (Gratis)

Aplikasi ini siap di-deploy dalam 1 menit ke platform hosting modern mana pun:

### Opsi A: Vercel (Rekomendasi)
1. Buat build produksi:
   ```bash
   npm run build
   ```
2. Hubungkan repository GitHub Anda ke [vercel.com](https://vercel.com) atau deploy folder `dist`.
3. Tambahkan Environment Variable di Vercel:
   - `VITE_SUPABASE_URL` = `https://sxwnweslamgdegmjsznm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_-wmXwhcY9XqedENRsuE5fw_NyxUXLZO`

### Opsi B: Netlify
Tarik (*drag & drop*) folder `dist` hasil build ke [app.netlify.com/drop](https://app.netlify.com/drop).
