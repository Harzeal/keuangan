# 💰 Aplikasi Pencatat Keuangan Pribadi (FinTrack) - Fauzan

Aplikasi web modern, responsif, dan lengkap untuk mencatat pemasukan dan pengeluaran keuangan bulanan. Dilengkapi integrasi database cloud **Supabase** agar dapat diakses dan diinput dari perangkat mana saja (HP Android/iPhone, Tablet, Laptop), serta didukung penyimpanan offline lokal (Local Storage) otomatis.

---

## 🌟 Fitur Utama

1. **Pencatatan Cepat & Mudah (Hanya Jumlah & Keperluan):**
   - Cukup masukkan **Jumlah Uang (Nominal)** dan **Untuk Apa (Keperluan)**.
   - Pilihan kategori fleksibel (+ dukungan menambah kategori kustom sendiri).
   - Pratinjau otomatis format Rupiah (`Rp 50.000`) dan kalimat terbilang Indonesia (*"Lima puluh ribu rupiah"*).
   - Tombol nominal cepat (`+10 rb`, `+25 rb`, `+50 rb`, `+100 rb`, `+500 rb`, `+1 Jt`).

2. **Sistem Anggaran & Pengurangan Otomatis (Budget Tracking):**
   - Fitur **Atur Anggaran Bulanan** (pagu belanja).
   - Aplikasi otomatis **mengurangi pengeluaran dari uang bulanan Anda**.
   - Indikator bar visual status anggaran (Aman, Waspada > 75%, Melebihi Anggaran).
   - **Rekomendasi Belanja Harian:** Aplikasi menghitung sisa hari dalam bulan tersebut dan memberikan batas belanja aman harian agar tidak defisit.

3. **Uang Masuk & Uang Keluar:**
   - Pencatatan **Uang Masuk** (Gaji, Bonus, Usaha, Hadiah, dll.) dengan efek selebrasi.
   - Pencatatan **Uang Keluar** (Makan & Minum, Bensin, Tagihan, Belanja, dll.).
   - Ringkasan 4 Kartu Metrik Utama:
     - 💳 Saldo Kas Keseluruhan (Net Balance)
     - 🟢 Uang Masuk Bulan Ini
     - 🔴 Uang Keluar Bulan Ini
     - 🎯 Sisa Uang / Anggaran Bulanan

4. **Navigasi Antar Bulan (Month Picker):**
   - Mudah berpindah ke bulan sebelumnya atau bulan berikutnya.
   - Lompat langsung ke "Bulan Ini" dengan satu klik.

5. **Visualisasi Data & Grafik (Chart.js):**
   - **Donut Chart:** Persentase dan rincian pengeluaran per kategori.
   - **Bar Chart:** Tren perbandingan uang masuk vs uang keluar harian.
   - Wawasan keuangan: Rata-rata pengeluaran per hari, kategori terboros, dan *saving rate* (rasio menabung).

6. **Privasi & Tampilan Modern:**
   - **Mode Privasi (Privacy Eye):** Sembunyikan nominal saldo saat berada di tempat umum atau membuka web di depan orang lain.
   - **Mode Gelap (Dark Mode) & Mode Terang:** Menyesuaikan preferensi mata dan tema perangkat.
   - Desain responsif ramah smartphone (termasuk *Bottom Navigation Bar* di HP).

7. **Ekspor & Pencadangan Data:**
   - Ekspor laporan bulanan ke format **Excel / CSV**.
   - Format cetak ramah printer (**Print Preview**).
   - **Cadangan JSON:** Download file backup atau pulihkan (*restore*) data kapan saja.

8. **Database Cloud Supabase & Mode Offline:**
   - Terintegrasi langsung dengan project Supabase Anda:
     - **Project URL:** `https://sxwnweslamgdegmjsznm.supabase.co`
     - **Publishable Key:** `sb_publishable_-wmXwhcY9XqedENRsuE5fw_NyxUXLZO`
   - Jika offline atau belum membuat tabel di Supabase, aplikasi tetap 100% berjalan lancar menggunakan LocalStorage perangkat, dan menyediakan fitur 1-klik migrasi data ke cloud.

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

1. Buka folder `e:\Fauzan\keuangan`.
2. Klik ganda file `index.html` untuk langsung membukanya di browser favorit Anda (Google Chrome, Edge, Safari, Firefox).
3. Tidak memerlukan instalasi server atau `npm install` apapun, semuanya langsung berjalan!

---

## 🗄️ Cara Mengaktifkan Database Supabase (Hanya 1 Kali)

Agar transaksi tersimpan secara online di database Supabase dan bisa diakses dari perangkat mana saja:

1. Buka dashboard Supabase Anda:
   👉 **[Supabase SQL Editor](https://supabase.com/dashboard/project/sxwnweslamgdegmjsznm/sql/new)**
2. Buka file [`supabase_schema.sql`](supabase_schema.sql) (atau klik tombol **Database** di pojok kanan atas aplikasi, lalu klik **Salin Kode SQL**).
3. Tempelkan (*paste*) seluruh kode SQL berikut ke SQL Editor Supabase:

```sql
-- 1. Buat Tabel Transaksi
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Lainnya',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);

-- 2. Buat Tabel Anggaran Bulanan
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year TEXT NOT NULL UNIQUE,
    budget_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Kebijakan Akses (RLS) untuk Publishable Key
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access transactions" 
ON public.transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public full access monthly_budgets" 
ON public.monthly_budgets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
```

4. Klik tombol hijau **RUN** di pojok kanan bawah editor Supabase.
5. Buka kembali halaman `index.html` di browser Anda, klik ikon **Database** lalu klik **"Tes Koneksi Ulang"** atau **"Upload Data Lokal ke Cloud"**. Badge status akan berubah menjadi **🟢 Online Cloud**!

---

## 🌐 Cara Mengonlinekan Web Ini Agar Bisa Dibuka Dari HP / Mana Saja (Gratis 100%)

Anda bisa mengonlinekan file `index.html` ini secara gratis dalam 2 menit menggunakan salah satu cara berikut:

### Opsi A: Menggunakan Vercel / Netlify (Paling Mudah)
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop) atau [vercel.com](https://vercel.com).
2. Tarik (*drag & drop*) folder `e:\Fauzan\keuangan` ke halaman tersebut.
3. Dalam 5 detik, Anda akan mendapatkan link website aktif (contoh: `keuangan-fauzan.netlify.app`).
4. Simpan link tersebut di bookmark browser HP Anda atau klik *"Add to Home Screen"* di HP agar menjadi seperti aplikasi native!

### Opsi B: Menggunakan GitHub Pages
1. Buat repository baru di GitHub (misal: `keuangan`).
2. Upload file `index.html`, `supabase_schema.sql`, dan `README.md`.
3. Masuk ke **Settings** > **Pages** > pilih branch `main` dan klik **Save**.
4. Website Anda siap diakses di `https://username.github.io/keuangan/`.

---

## 📱 Struktur Berkas Proyek

```
e:\Fauzan\keuangan/
├── index.html           # Aplikasi web utama lengkap (UI, Logika, Charts, Supabase)
├── supabase_schema.sql  # Skrip migrasi database Supabase siap pakai
└── README.md            # Dokumentasi panduan penggunaan & panduan online
```
