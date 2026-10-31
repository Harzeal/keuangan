import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Transaction,
  BudgetSettings,
  Category,
  MonthSummary,
  SmartRecommendation,
  MainCategory
} from '../types/database';
import { getCurrentMonthYear, getMonthDaysInfo, getAlertStatus } from '../lib/utils';

export function useBudget(selectedMonthYear: string = getCurrentMonthYear()) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({
    month_year: selectedMonthYear,
    monthly_income: 0,
    needs_percentage: 50,
    wants_percentage: 20,
    savings_percentage: 30
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ambil data kategori
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('name');

      if (!error && data) {
        setCategories(data as Category[]);
      }
    } catch (err: any) {
      console.warn('Gagal fetch categories:', err.message);
    }
  }, [user]);

  // Ambil pengaturan budget bulan terpilih
  const fetchBudgetSettings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('budget_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', selectedMonthYear)
        .maybeSingle();

      if (data) {
        setBudgetSettings(data as BudgetSettings);
      } else {
        // Coba cari bulan sebelumnya sebagai acuan default alokasi
        const { data: prevData } = await supabase
          .from('budget_settings')
          .select('*')
          .eq('user_id', user.id)
          .order('month_year', { ascending: false })
          .limit(1)
          .maybeSingle();

        const newSetting: BudgetSettings = {
          user_id: user.id,
          month_year: selectedMonthYear,
          monthly_income: prevData?.monthly_income || 0,
          needs_percentage: prevData?.needs_percentage || 50,
          wants_percentage: prevData?.wants_percentage || 20,
          savings_percentage: prevData?.savings_percentage || 30
        };

        setBudgetSettings(newSetting);
      }
    } catch (err: any) {
      console.warn('Gagal fetch budget settings:', err.message);
    }
  }, [user, selectedMonthYear]);

  // Ambil transaksi untuk bulan terpilih & seluruh riwayat transaksi
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Ambil transaksi bulan aktif
      const [year, month] = selectedMonthYear.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const { data: monthData, error: monthError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      const formatTxList = (list: any[]): Transaction[] => {
        return list.map((t: any) => ({
          ...t,
          category_name: t.category_name || t.category || 'Umum',
          main_category: t.main_category || (t.type === 'income' ? 'income' : 'needs'),
          category_id: t.category_id || null
        }));
      };

      if (monthError) throw monthError;
      setTransactions(formatTxList(monthData || []));

      // 2. Ambil seluruh transaksi untuk analitik multi-bulan (maksimal 6 bulan terakhir)
      const { data: allData, error: allError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!allError && allData) {
        setAllTransactions(formatTxList(allData || []));
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Gagal mengambil data transaksi');
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonthYear]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchCategories(), fetchBudgetSettings(), fetchTransactions()]);
    }
  }, [user, selectedMonthYear, fetchCategories, fetchBudgetSettings, fetchTransactions]);

  // Simpan / update Budget Settings ke Supabase
  const saveBudgetSettings = async (newSettings: Partial<BudgetSettings>) => {
    if (!user) return { error: new Error('User tidak ditemukan') };

    const merged = {
      ...budgetSettings,
      ...newSettings,
      user_id: user.id,
      month_year: selectedMonthYear,
      updated_at: new Date().toISOString()
    };

    setBudgetSettings(merged);

    try {
      const { data, error } = await supabase
        .from('budget_settings')
        .upsert(merged, { onConflict: 'user_id,month_year' })
        .select()
        .single();

      if (error) throw error;
      if (data) setBudgetSettings(data as BudgetSettings);
      return { error: null };
    } catch (err: any) {
      console.error('Gagal menyimpan budget settings:', err);
      return { error: err };
    }
  };

  // Tambah Transaksi Baru
  const addTransaction = async (txData: {
    type: 'income' | 'expense';
    amount: number;
    title: string;
    main_category: MainCategory;
    category_name: string;
    category_id?: string | null;
    date: string;
    notes?: string;
  }) => {
    if (!user) return { error: new Error('User tidak ditemukan'), data: null };

    try {
      const payload: Record<string, any> = {
        user_id: user.id,
        type: txData.type,
        amount: txData.amount,
        title: txData.title,
        main_category: txData.main_category,
        category_name: txData.category_name,
        category: txData.category_name, // fallback untuk tabel Supabase versi lama
        date: txData.date,
        notes: txData.notes || txData.title,
        created_at: new Date().toISOString()
      };

      // Hanya sertakan category_id jika benar-benar ada (bukan untuk pemasukan)
      if (txData.type !== 'income' && txData.category_id && typeof txData.category_id === 'string' && txData.category_id.trim() !== '') {
        payload.category_id = txData.category_id.trim();
      }

      let { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      // Fallback Cerdas: Jika tabel Supabase user belum punya kolom 'category_id'
      if (error && error.message && error.message.toLowerCase().includes('category_id')) {
        console.warn("Kolom 'category_id' belum ada di Supabase, mencoba insert ulang tanpa category_id...");
        delete payload.category_id;
        const retryResult = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      // Fallback jika 'category_name' belum ada (hanya ada kolom lama 'category')
      if (error && error.message && error.message.toLowerCase().includes('category_name')) {
        console.warn("Kolom 'category_name' belum ada, mencoba insert hanya dengan 'category'...");
        delete payload.category_name;
        const retryResult = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) throw error;

      if (data) {
        // Jika transaksi jatuh pada bulan yang sedang dilihat
        if (data.date.startsWith(selectedMonthYear)) {
          setTransactions((prev) => [data as Transaction, ...prev]);
        }
        setAllTransactions((prev) => [data as Transaction, ...prev]);

        // Jika transaksi berupa pemasukan dan monthly_income masih 0, otomatis perbarui monthly_income
        if (data.type === 'income' && budgetSettings.monthly_income === 0) {
          saveBudgetSettings({ monthly_income: data.amount });
        }
      }

      return { error: null, data: data as Transaction };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  // Hapus Transaksi
  const deleteTransaction = async (id: string) => {
    if (!user) return { error: new Error('User tidak ditemukan') };
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setAllTransactions((prev) => prev.filter((t) => t.id !== id));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Edit / Update Transaksi
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return { error: new Error('User tidak ditemukan') };
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTransactions((prev) => prev.map((t) => (t.id === id ? (data as Transaction) : t)));
        setAllTransactions((prev) => prev.map((t) => (t.id === id ? (data as Transaction) : t)));
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Tambah Kategori Kustom
  const addCustomCategory = async (catData: {
    name: string;
    main_category: MainCategory;
    icon?: string;
    color?: string;
  }) => {
    if (!user) return { error: new Error('User tidak ditemukan'), data: null };
    try {
      const newCat = {
        user_id: user.id,
        name: catData.name.trim(),
        main_category: catData.main_category,
        icon: catData.icon || 'Tag',
        color: catData.color || '#6366f1',
        is_default: false
      };

      const { data, error } = await supabase
        .from('categories')
        .insert(newCat)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCategories((prev) => [...prev, data as Category]);
      }
      return { error: null, data: data as Category };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  // Hapus Kategori Kustom
  const deleteCustomCategory = async (id: string) => {
    if (!user) return { error: new Error('User tidak ditemukan') };
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // =========================================================================
  // KALKULASI RINGKASAN METRIK BULANAN (MONTH SUMMARY)
  // =========================================================================
  const summary: MonthSummary = useMemo(() => {
    // Total income: jika user menginput pendapatan di settings, gunakan itu, ditambah jika ada transaksi income
    const incomeFromTransactions = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const baseIncome = Number(budgetSettings.monthly_income || 0);
    const totalIncome = Math.max(baseIncome, incomeFromTransactions);

    // Pengeluaran per kategori alokasi
    const expenseTx = transactions.filter((t) => t.type === 'expense');

    const needsExpense = expenseTx
      .filter((t) => t.main_category === 'needs')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const wantsExpense = expenseTx
      .filter((t) => t.main_category === 'wants')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsAllocated = expenseTx
      .filter((t) => t.main_category === 'savings')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = needsExpense + wantsExpense; // Pengeluaran operasional (kebutuhan + keinginan)

    // Pagu Anggaran berdasarkan persentase
    const budgetNeeds = Math.round((totalIncome * budgetSettings.needs_percentage) / 100);
    const budgetWants = Math.round((totalIncome * budgetSettings.wants_percentage) / 100);
    const budgetSavings = Math.round((totalIncome * budgetSettings.savings_percentage) / 100);

    const remainingNeedsBudget = budgetNeeds - needsExpense;
    const remainingWantsBudget = budgetWants - wantsExpense;
    const remainingTotalBudget = (budgetNeeds + budgetWants) - totalExpense;

    // Rasio menabung realisasi
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((savingsAllocated + Math.max(0, netSavings - savingsAllocated)) / totalIncome) * 100 : 0;

    // Total hari & Sisa hari dalam bulan berjalan
    const { totalDays, daysLeft } = getMonthDaysInfo(selectedMonthYear);

    // Total uang bulanan acuan limit:
    // Sesuai permintaan: Limit harian membagi total uang bulanan dengan total hari dalam 1 bulan itu
    const totalMonthlyMoney = totalIncome > 0 ? totalIncome : (budgetNeeds + budgetWants);

    // 1. Limit Harian = Total uang bulanan dibagi total hari dalam 1 bulan (misal 30 atau 31 hari)
    const dailyLimit = totalDays > 0 ? Math.round(totalMonthlyMoney / totalDays) : 0;

    // 2. Limit Mingguan = Limit Harian dikali 7 hari
    const weeklyLimit = dailyLimit * 7;

    // Pengeluaran Hari Ini (Expenses dengan tanggal hari ini, tidak termasuk pos tabungan)
    const todayStr = new Date().toISOString().split('T')[0];
    const spentToday = expenseTx
      .filter((t) => t.date === todayStr && t.main_category !== 'savings')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remainingToday = dailyLimit - spentToday;

    // Pengeluaran Minggu Ini (Senin sampai hari ini, tidak termasuk pos tabungan)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    const spentThisWeek = expenseTx
      .filter((t) => t.date >= mondayStr && t.date <= todayStr && t.main_category !== 'savings')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remainingThisWeek = weeklyLimit - spentThisWeek;

    // Smart Alert Levels
    const alertDaily = getAlertStatus(spentToday, dailyLimit);
    const alertWeekly = getAlertStatus(spentThisWeek, weeklyLimit);
    const alertMonthly = getAlertStatus(totalExpense, budgetNeeds + budgetWants);

    return {
      month_year: selectedMonthYear,
      income: totalIncome,
      total_expense: totalExpense,
      needs_expense: needsExpense,
      wants_expense: wantsExpense,
      savings_allocated: savingsAllocated,
      net_savings: netSavings,
      budget_needs: budgetNeeds,
      budget_wants: budgetWants,
      budget_savings: budgetSavings,
      remaining_needs_budget: remainingNeedsBudget,
      remaining_wants_budget: remainingWantsBudget,
      remaining_total_budget: remainingTotalBudget,
      savings_rate_percent: Math.min(100, Math.max(0, savingsRate)),
      daily_limit: dailyLimit,
      spent_today: spentToday,
      remaining_today: remainingToday,
      weekly_limit: weeklyLimit,
      spent_this_week: spentThisWeek,
      remaining_this_week: remainingThisWeek,
      days_left_in_month: daysLeft,
      total_days_in_month: totalDays,
      alert_level_daily: alertDaily,
      alert_level_weekly: alertWeekly,
      alert_level_monthly: alertMonthly
    };
  }, [transactions, budgetSettings, selectedMonthYear]);

  // =========================================================================
  // ANALISIS PERBANDINGAN ANTAR BULAN (MONTH-OVER-MONTH DATA)
  // =========================================================================
  const monthlyComparison = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number; savings: number }>();

    allTransactions.forEach((t) => {
      const m = t.date.substring(0, 7); // 'YYYY-MM'
      if (!map.has(m)) {
        map.set(m, { month: m, income: 0, expense: 0, savings: 0 });
      }
      const record = map.get(m)!;
      const amt = Number(t.amount);
      if (t.type === 'income') {
        record.income += amt;
      } else {
        if (t.main_category === 'savings') {
          record.savings += amt;
        } else {
          record.expense += amt;
        }
      }
    });

    // Pastikan bulan terpilih ada dalam perbandingan
    if (!map.has(selectedMonthYear)) {
      map.set(selectedMonthYear, {
        month: selectedMonthYear,
        income: summary.income,
        expense: summary.total_expense,
        savings: summary.savings_allocated
      });
    }

    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // 6 bulan terakhir
  }, [allTransactions, selectedMonthYear, summary]);

  // =========================================================================
  // REKOMENDASI PINTAR / ALGORITMA FINANSIAL (SMART ADVISOR)
  // =========================================================================
  const recommendations: SmartRecommendation[] = useMemo(() => {
    const recs: SmartRecommendation[] = [];

    if (summary.income === 0) {
      recs.push({
        type: 'action',
        title: 'Masukkan Estimasi Pemasukan Bulanan',
        message: 'Tentukan estimasi penghasilan atau gaji Anda bulan ini di kartu alokasi anggaran agar sistem dapat mengalkulasi batas belanja harian dengan akurat.'
      });
      return recs;
    }

    // 1. Cek Pengeluaran Keinginan (Wants)
    if (summary.wants_expense > summary.budget_wants) {
      const overspent = summary.wants_expense - summary.budget_wants;
      recs.push({
        type: 'warning',
        title: 'Pos Keinginan Melebihi Batas Alokasi!',
        message: `Pengeluaran gaya hidup & hiburan telah melebihi alokasi ${budgetSettings.wants_percentage}% sebesar Rp ${overspent.toLocaleString('id-ID')}. Disarankan menahan belanja tersier dan nongkrong di sisa bulan ini.`,
        impactNominal: overspent,
        category: 'Keinginan'
      });
    } else {
      recs.push({
        type: 'success',
        title: 'Disiplin Pos Keinginan Terjaga',
        message: `Bagus! Pengeluaran gaya hidup masih aman terkendali di bawah batas target Rp ${summary.budget_wants.toLocaleString('id-ID')}.`
      });
    }

    // 2. Cek Pengeluaran Kebutuhan (Needs)
    if (summary.needs_expense > summary.budget_needs) {
      const overNeeds = summary.needs_expense - summary.budget_needs;
      recs.push({
        type: 'warning',
        title: 'Pos Kebutuhan Pokok Bengkak',
        message: `Biaya kebutuhan pokok melampaui ${budgetSettings.needs_percentage}%. Cek apakah ada pos tagihan atau belanja dapur tak terduga yang bisa diefisiensikan bulan depan.`,
        impactNominal: overNeeds,
        category: 'Kebutuhan'
      });
    }

    // 3. Rekomendasi Tabungan & Investasi
    if (summary.savings_rate_percent < budgetSettings.savings_percentage) {
      const gap = budgetSettings.savings_percentage - summary.savings_rate_percent;
      recs.push({
        type: 'tip',
        title: 'Tingkatkan Tabungan & Investasi',
        message: `Realisasi tabungan Anda (${summary.savings_rate_percent.toFixed(1)}%) masih di bawah target ${budgetSettings.savings_percentage}%. Gunakan trik "Pay Yourself First" dengan menyisihkan tabungan di awal bulan begitu gaji masuk.`
      });
    } else {
      recs.push({
        type: 'success',
        title: 'Target Tabungan Tercapai!',
        message: `Hebat! Anda berhasil menyisihkan ${summary.savings_rate_percent.toFixed(1)}% dari pemasukan ke instrumen tabungan / investasi.`
      });
    }

    // 4. Kategori Pengeluaran Terbesar (Highest Spending Category)
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && t.main_category !== 'savings')
      .forEach((t) => {
        categoryTotals[t.category_name] = (categoryTotals[t.category_name] || 0) + Number(t.amount);
      });

    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const [topCat, topAmount] = sortedCats[0];
      const percentOfExpense = ((topAmount / (summary.total_expense || 1)) * 100).toFixed(0);
      recs.push({
        type: 'action',
        title: `Pengeluaran Terbesar: ${topCat}`,
        message: `Kategori '${topCat}' menyerap ${percentOfExpense}% (Rp ${topAmount.toLocaleString('id-ID')}) dari total belanja Anda. Evaluasi apakah ada pos yang bisa dipangkas untuk bulan depan.`
      });
    }

    return recs;
  }, [summary, budgetSettings, transactions]);

  return {
    transactions,
    allTransactions,
    budgetSettings,
    categories,
    loading,
    error,
    summary,
    recommendations,
    monthlyComparison,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    saveBudgetSettings,
    addCustomCategory,
    deleteCustomCategory,
    refreshData: () => {
      fetchCategories();
      fetchBudgetSettings();
      fetchTransactions();
    }
  };
}
