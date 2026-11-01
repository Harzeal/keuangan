-- ==============================================================================
-- SKEMA DATABASE LENGKAP & BERSIH: FINFLOW PERSONAL FINANCE (SUPABASE)
-- Multi-User Terisolasi dengan Row Level Security (RLS) & Kategori Bawaan
-- ==============================================================================
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Buka Supabase Dashboard -> Proyek Anda -> Menu "SQL Editor".
-- 2. Buat tab baru ("New Query").
-- 3. Pastikan kolom editor KOSONG (tekan Ctrl+A lalu Delete).
-- 4. Tempel (Paste) SELURUH kode di bawah ini tanpa ada teks yang ter-blok sebagian.
-- 5. Klik tombol hijau "RUN".
-- ==============================================================================

-- 1. EKSTENSI UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFIL PENGGUNA (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABEL ALOKASI ANGGARAN (BUDGET SETTINGS)
CREATE TABLE IF NOT EXISTS public.budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format 'YYYY-MM', misal '2026-10'
    monthly_income NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
    needs_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    wants_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    savings_percentage NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_month_budget UNIQUE (user_id, month_year)
);

-- 4. TABEL KATEGORI (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = kategori standar sistem
    name TEXT NOT NULL,
    main_category TEXT NOT NULL CHECK (main_category IN ('needs', 'wants', 'savings', 'income')),
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#6366f1',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABEL TRANSAKSI (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Lainnya',
    main_category TEXT DEFAULT 'needs' CHECK (main_category IN ('needs', 'wants', 'savings', 'income')),
    category_name TEXT DEFAULT 'Lainnya',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- MIGRASI PENAMBAHAN KOLOM OTOMATIS (Jika tabel transactions sudah pernah ada sebelumnya)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS main_category TEXT DEFAULT 'needs' CHECK (main_category IN ('needs', 'wants', 'savings', 'income'));
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_name TEXT DEFAULT 'Lainnya';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 6. TABEL NOTIFIKASI PENGGUNA (USER NOTIFICATIONS)
-- Menyimpan riwayat notifikasi harian, mingguan, bulanan yang tersinkronisasi lintas platform (.apk, .exe, web)
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'alert', 'system')),
    reference_date TEXT NOT NULL, -- Format 'YYYY-MM-DD', 'YYYY-Wxx', atau 'YYYY-MM'
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_notif_period UNIQUE (user_id, type, reference_date)
);

-- 7. INDEXING UNTUK PERFORMA TINGGI
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_budget_settings_user_month ON public.budget_settings (user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications (user_id, created_at DESC);

-- 8. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 8. KEBIJAKAN AKSES (POLICIES)
-- Profiles
DROP POLICY IF EXISTS "User can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "User can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "User can insert own profile" ON public.profiles;

CREATE POLICY "User can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "User can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "User can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Budget Settings
DROP POLICY IF EXISTS "User can manage budget settings" ON public.budget_settings;
CREATE POLICY "User can manage budget settings" ON public.budget_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Categories (Bisa baca kategori sistem NULL atau kategori miliknya sendiri)
DROP POLICY IF EXISTS "User can view categories" ON public.categories;
DROP POLICY IF EXISTS "User can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "User can update own categories" ON public.categories;
DROP POLICY IF EXISTS "User can delete own categories" ON public.categories;

CREATE POLICY "User can view categories" ON public.categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "User can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "User can manage own transactions" ON public.transactions;
CREATE POLICY "User can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Notifications
DROP POLICY IF EXISTS "User can manage own notifications" ON public.user_notifications;
CREATE POLICY "User can manage own notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. POPULASI KATEGORI BAWAAN STANDAR (GLOBAL: user_id = NULL)
-- Kategori ini langsung tersedia dan bisa dibaca oleh semua pengguna baru maupun lama
INSERT INTO public.categories (user_id, name, main_category, icon, color, is_default)
VALUES
    -- Kebutuhan (Needs)
    (NULL, 'Makanan Pokok & Belanja Dapur', 'needs', 'Utensils', '#0284c7', true),
    (NULL, 'Sewa / Kos / KPR & Utilitas', 'needs', 'Home', '#0ea5e9', true),
    (NULL, 'Tagihan Listrik & Air', 'needs', 'Zap', '#38bdf8', true),
    (NULL, 'Transportasi & Bensin', 'needs', 'Car', '#06b6d4', true),
    (NULL, 'Kesehatan & Obat', 'needs', 'HeartPulse', '#14b8a6', true),
    (NULL, 'Pendidikan & Kursus', 'needs', 'GraduationCap', '#10b981', true),

    -- Keinginan (Wants)
    (NULL, 'Kafe, Kuliner & Hangout', 'wants', 'Coffee', '#f59e0b', true),
    (NULL, 'Belanja Gaya Hidup & Fashion', 'wants', 'ShoppingBag', '#f97316', true),
    (NULL, 'Hiburan & Streaming (Netflix/Spotify)', 'wants', 'Film', '#ec4899', true),
    (NULL, 'Hobi & Game', 'wants', 'Gamepad2', '#d946ef', true),
    (NULL, 'Liburan & Jalan-jalan', 'wants', 'Plane', '#a855f7', true),

    -- Tabungan & Investasi (Savings)
    (NULL, 'Dana Darurat', 'savings', 'ShieldCheck', '#10b981', true),
    (NULL, 'Investasi (Saham / Reksadana / Emas)', 'savings', 'TrendingUp', '#059669', true),
    (NULL, 'Tabungan Impian & Rumah', 'savings', 'PiggyBank', '#047857', true),

    -- Pemasukan (Income)
    (NULL, 'Gaji Pokok Bulanan', 'income', 'Briefcase', '#22c55e', true),
    (NULL, 'Bonus & THR', 'income', 'Gift', '#16a34a', true),
    (NULL, 'Pendapatan Usaha / Bisnis', 'income', 'Store', '#15803d', true),
    (NULL, 'Freelance / Sampingan', 'income', 'Laptop', '#4ade80', true),
    (NULL, 'Dividen / Passive Income', 'income', 'LineChart', '#86efac', true)
ON CONFLICT DO NOTHING;

-- 10. TRIGGER PROFIL PENGGUNA BARU (OTOMATIS SAAT REGISTER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.budget_settings (user_id, month_year, monthly_income, needs_percentage, wants_percentage, savings_percentage)
    VALUES (
        new.id,
        to_char(CURRENT_DATE, 'YYYY-MM'),
        0,
        50.00,
        20.00,
        30.00
    )
    ON CONFLICT (user_id, month_year) DO NOTHING;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. REFRESH SCHEMA CACHE SUPABASE
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- SELESAI! Database Anda siap digunakan secara aman dan real-time.
-- ==============================================================================
