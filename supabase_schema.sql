-- ==============================================================================
-- SQL SCHEMA UNTUK APLIKASI PENCATAT KEUANGAN (SUPABASE)
-- Proyek: sxwnweslamgdegmjsznm
-- ==============================================================================
-- CARA MENJALANKAN:
-- 1. Buka dashboard Supabase: https://supabase.com/dashboard/project/sxwnweslamgdegmjsznm
-- 2. Pilih menu "SQL Editor" di bilah navigasi sebelah kiri.
-- 3. Klik "New Query".
-- 4. Tempel (Paste) seluruh kode SQL di bawah ini, lalu klik tombol "RUN" (hijau).
-- ==============================================================================

-- 1. Buat Tabel Transaksi (Uang Masuk & Uang Keluar)
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

-- Index untuk mempercepat query berdasarkan tanggal & tipe
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);

-- 2. Buat Tabel Anggaran Bulanan (Monthly Budgets)
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year TEXT NOT NULL UNIQUE, -- Format 'YYYY-MM', contoh: '2026-10'
    budget_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Konfigurasi Row Level Security (RLS) & Kebijakan Akses (Policy)
-- Memungkinkan akses penuh baca & tulis menggunakan Publishable API Key Anda
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada agar tidak bentrok
DROP POLICY IF EXISTS "Public full access transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public full access monthly_budgets" ON public.monthly_budgets;

-- Buat kebijakan baru untuk anon & authenticated
CREATE POLICY "Public full access transactions" 
ON public.transactions 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Public full access monthly_budgets" 
ON public.monthly_budgets 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- Selesai! Tabel database Anda siap digunakan secara online dan real-time.
-- ==============================================================================
