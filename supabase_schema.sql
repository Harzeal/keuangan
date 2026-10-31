-- ==============================================================================
-- SKEMA DATABASE LENGKAP: APLIKASI PENGELOLAAN KEUANGAN PRIBADI (MULTI-USER)
-- Dilengkapi Autentikasi Supabase, Row Level Security (RLS) & Triggers Otomatis
-- ==============================================================================
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard -> Proyek Anda -> Menu "SQL Editor".
-- 2. Klik "New Query".
-- 3. Salin (Copy) dan Tempel (Paste) seluruh skrip di bawah ini.
-- 4. Klik tombol "RUN" (hijau).
-- ==============================================================================

-- 1. EKSTENSI (UUID Generator)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFIL PENGGUNA (PROFILES)
-- Menyimpan detail profil yang terhubung langsung dengan auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABEL ALOKASI ANGGARAN BULANAN (BUDGET SETTINGS)
-- Menyimpan pendapatan bulanan & persentase alokasi (Default: Kebutuhan 50%, Keinginan 20%, Tabungan 30%)
CREATE TABLE IF NOT EXISTS public.budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format 'YYYY-MM', misal '2026-10'
    monthly_income NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
    needs_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00 CHECK (needs_percentage >= 0 AND needs_percentage <= 100),
    wants_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (wants_percentage >= 0 AND wants_percentage <= 100),
    savings_percentage NUMERIC(5, 2) NOT NULL DEFAULT 30.00 CHECK (savings_percentage >= 0 AND savings_percentage <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_month_budget UNIQUE (user_id, month_year)
);

-- 4. TABEL KATEGORI KUSTOM & STANDAR (CATEGORIES)
-- Menyimpan kategori pengeluaran dan pemasukan untuk tiap pengguna
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Jika NULL berarti kategori sistem / default
    name TEXT NOT NULL,
    main_category TEXT NOT NULL CHECK (main_category IN ('needs', 'wants', 'savings', 'income')),
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#6366f1',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABEL TRANSAKSI (TRANSACTIONS)
-- Menyimpan seluruh catatan pemasukan dan pengeluaran pengguna
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    title TEXT NOT NULL,
    main_category TEXT NOT NULL CHECK (main_category IN ('needs', 'wants', 'savings', 'income')),
    category_name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Penyesuaian Kolom (Migrasi Otomatis jika tabel transactions lama sudah ada sebelumnya)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS main_category TEXT DEFAULT 'needs' CHECK (main_category IN ('needs', 'wants', 'savings', 'income'));
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_name TEXT DEFAULT 'Lainnya';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 6. INDEXING UNTUK PERFORMA TINGGI
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_main_cat ON public.transactions (user_id, main_category);
CREATE INDEX IF NOT EXISTS idx_budget_settings_user_month ON public.budget_settings (user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);

-- 7. ROW LEVEL SECURITY (RLS) - DATA TERISOLASI 100% PER PENGGUNA
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan sebelumnya jika pernah ada
DROP POLICY IF EXISTS "User can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "User can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "User can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "User can view own budget settings" ON public.budget_settings;
DROP POLICY IF EXISTS "User can insert own budget settings" ON public.budget_settings;
DROP POLICY IF EXISTS "User can update own budget settings" ON public.budget_settings;
DROP POLICY IF EXISTS "User can delete own budget settings" ON public.budget_settings;

DROP POLICY IF EXISTS "User can view categories" ON public.categories;
DROP POLICY IF EXISTS "User can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "User can update own categories" ON public.categories;
DROP POLICY IF EXISTS "User can delete own categories" ON public.categories;

DROP POLICY IF EXISTS "User can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "User can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "User can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "User can delete own transactions" ON public.transactions;

-- KEBIJAKAN PROFILES
CREATE POLICY "User can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "User can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "User can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- KEBIJAKAN BUDGET SETTINGS
CREATE POLICY "User can view own budget settings"
    ON public.budget_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "User can insert own budget settings"
    ON public.budget_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own budget settings"
    ON public.budget_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "User can delete own budget settings"
    ON public.budget_settings FOR DELETE
    USING (auth.uid() = user_id);

-- KEBIJAKAN CATEGORIES (Bisa baca kategori default sistem yang user_id IS NULL atau kategori miliknya)
CREATE POLICY "User can view categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "User can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "User can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- KEBIJAKAN TRANSACTIONS
CREATE POLICY "User can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "User can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "User can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- 8. TRIGGER OTOMATIS: INISIALISASI PENGGUNA BARU
-- Ketika ada pengguna mendaftar melalui Supabase Auth, otomatis buatkan profil dan kategori bawaan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Buat data profil
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Buat budget default bulan berjalan (50% Kebutuhan, 20% Keinginan, 30% Tabungan)
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

    -- 3. Tambahkan kategori-kategori standar awal untuk pengguna tersebut
    INSERT INTO public.categories (user_id, name, main_category, icon, color, is_default)
    VALUES
        -- Kebutuhan (Needs - 50%)
        (new.id, 'Makanan Pokok & Belanja Dapur', 'needs', 'Utensils', '#0284c7', true),
        (new.id, 'Sewa / Kos / KPR & Utilitas', 'needs', 'Home', '#0ea5e9', true),
        (new.id, 'Tagihan Listrik & Air', 'needs', 'Zap', '#38bdf8', true),
        (new.id, 'Transportasi & Bensin', 'needs', 'Car', '#06b6d4', true),
        (new.id, 'Kesehatan & Obat', 'needs', 'HeartPulse', '#14b8a6', true),
        (new.id, 'Pendidikan & Kursus', 'needs', 'GraduationCap', '#10b981', true),

        -- Keinginan (Wants - 20%)
        (new.id, 'Kafe, Kuliner & Hangout', 'wants', 'Coffee', '#f59e0b', true),
        (new.id, 'Belanja Gaya Hidup & Fashion', 'wants', 'ShoppingBag', '#f97316', true),
        (new.id, 'Hiburan & Streaming (Netflix/Spotify)', 'wants', 'Film', '#ec4899', true),
        (new.id, 'Hobi & Game', 'wants', 'Gamepad2', '#d946ef', true),
        (new.id, 'Liburan & Jalan-jalan', 'wants', 'Plane', '#a855f7', true),

        -- Tabungan & Investasi (Savings - 30%)
        (new.id, 'Dana Darurat', 'savings', 'ShieldCheck', '#10b981', true),
        (new.id, 'Investasi (Saham / Reksadana / Emas)', 'savings', 'TrendingUp', '#059669', true),
        (new.id, 'Tabungan Impian & Rumah', 'savings', 'PiggyBank', '#047857', true),

        -- Pemasukan (Income)
        (new.id, 'Gaji Pokok Bulanan', 'income', 'Briefcase', '#22c55e', true),
        (new.id, 'Bonus & THR', 'income', 'Gift', '#16a34a', true),
        (new.id, 'Pendapatan Usaha / Bisnis', 'income', 'Store', '#15803d', true),
        (new.id, 'Freelance / Sampingan', 'income', 'Laptop', '#4ade80', true),
        (new.id, 'Dividen / Passive Income', 'income', 'LineChart', '#86efac', true)
    ON CONFLICT DO NOTHING;

    RETURN new;
END;
$$;

-- Pasang Trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Refresh cache PostgREST agar kolom baru langsung dikenali oleh API Supabase
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- SELESAI! Skema database siap digunakan untuk aplikasi multi-user aman.
-- ==============================================================================
