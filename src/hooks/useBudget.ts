import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Transaction,
  BudgetSettings,
  Category,
  MonthSummary,
  SmartRecommendation,
  MainCategory,
  Wallet,
  RecurringTransaction
} from '../types/database';
import { getCurrentMonthYear, getMonthDaysInfo, getAlertStatus } from '../lib/utils';

export function useBudget(selectedMonthYear: string = getCurrentMonthYear()) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allBudgetSettings, setAllBudgetSettings] = useState<BudgetSettings[]>([]);
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
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // State Multi-Dompet (Wallets)
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    if (typeof window === 'undefined') return [
      { id: 'w_cash', name: 'Kas / Tunai', type: 'cash', initial_balance: 0, color: '#10b981', icon: 'Wallet', is_default: true },
      { id: 'w_bank', name: 'Rekening Bank', type: 'bank', initial_balance: 0, color: '#3b82f6', icon: 'Landmark' },
      { id: 'w_ewallet', name: 'E-Wallet', type: 'ewallet', initial_balance: 0, color: '#8b5cf6', icon: 'Smartphone' }
    ];
    const saved = localStorage.getItem('FINFLOW_WALLETS');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'w_cash', name: 'Kas / Tunai', type: 'cash', initial_balance: 0, color: '#10b981', icon: 'Wallet', is_default: true },
      { id: 'w_bank', name: 'Rekening Bank', type: 'bank', initial_balance: 0, color: '#3b82f6', icon: 'Landmark' },
      { id: 'w_ewallet', name: 'E-Wallet', type: 'ewallet', initial_balance: 0, color: '#8b5cf6', icon: 'Smartphone' }
    ];
  });

  const saveWallets = (newWallets: Wallet[]) => {
    setWallets(newWallets);
    localStorage.setItem('FINFLOW_WALLETS', JSON.stringify(newWallets));
  };

  const addWallet = (wallet: Omit<Wallet, 'id'>) => {
    const newW: Wallet = {
      ...wallet,
      id: `wallet_${Date.now()}`
    };
    saveWallets([...wallets, newW]);
  };

  const deleteWallet = (id: string) => {
    saveWallets(wallets.filter((w) => w.id !== id));
  };

  const updateWallet = (updated: Wallet) => {
    saveWallets(wallets.map((w) => (w.id === updated.id ? updated : w)));
  };

  // State Transaksi Berulang (Recurring Bills)
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('FINFLOW_RECURRING');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const saveRecurring = (list: RecurringTransaction[]) => {
    setRecurringList(list);
    localStorage.setItem('FINFLOW_RECURRING', JSON.stringify(list));
  };

  const addRecurring = (item: Omit<RecurringTransaction, 'id'>) => {
    const newItem: RecurringTransaction = {
      ...item,
      id: `rec_${Date.now()}`
    };
    saveRecurring([...recurringList, newItem]);
  };

  const deleteRecurring = (id: string) => {
    saveRecurring(recurringList.filter((r) => r.id !== id));
  };

  const toggleRecurring = (id: string) => {
    saveRecurring(recurringList.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r)));
  };

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
        localStorage.setItem(`FINFLOW_CACHE_CAT_${user.id}`, JSON.stringify(data));
      }
    } catch (err: any) {
      console.warn('Gagal fetch categories:', err.message);
      const cached = localStorage.getItem(`FINFLOW_CACHE_CAT_${user.id}`);
      if (cached) {
        try { setCategories(JSON.parse(cached)); } catch {}
      }
    }
  }, [user]);

  // Ambil pengaturan budget bulan terpilih & seluruh budget settings
  const fetchBudgetSettings = useCallback(async () => {
    if (!user) return;
    try {
      const { data: allData, error } = await supabase
        .from('budget_settings')
        .select('*')
        .eq('user_id', user.id);

      if (allData) {
        setAllBudgetSettings(allData as BudgetSettings[]);
        localStorage.setItem(`FINFLOW_CACHE_BUDGET_${user.id}`, JSON.stringify(allData));
      }

      const current = allData?.find((s) => s.month_year === selectedMonthYear);
      if (current) {
        setBudgetSettings(current as BudgetSettings);
      } else {
        // Coba cari bulan sebelumnya sebagai acuan default alokasi
        const sorted = [...(allData || [])].sort((a, b) => b.month_year.localeCompare(a.month_year));
        const prevData = sorted[0];

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
      const cached = localStorage.getItem(`FINFLOW_CACHE_BUDGET_${user.id}`);
      if (cached) {
        try {
          const all = JSON.parse(cached);
          setAllBudgetSettings(all);
          const cur = all.find((s: any) => s.month_year === selectedMonthYear);
          if (cur) setBudgetSettings(cur);
        } catch {}
      }
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
        return list.map((t: any) => {
          let wallet = t.wallet_name;
          const notesStr = t.notes || '';
          if (!wallet && notesStr) {
            const match = notesStr.match(/\[Dompet:\s*([^\]]+)\]/);
            if (match) {
              wallet = match[1].trim();
            }
          }
          const isFromSavings = Boolean(t.is_from_savings || notesStr.includes('[Pakai Tabungan]'));
          const isTransfer = Boolean(
            t.is_transfer ||
            notesStr.includes('[Pindah Saldo:') ||
            notesStr.includes('[Transfer:') ||
            t.category_name === 'Pindah Saldo' ||
            t.category_name === 'Tarik Tunai'
          );

          let transferFrom = t.transfer_from;
          let transferTo = t.transfer_to;
          if (notesStr) {
            const matchTransfer = notesStr.match(/\[(?:Pindah Saldo|Transfer):\s*([^-]+)->\s*([^\]]+)\]/);
            if (matchTransfer) {
              transferFrom = matchTransfer[1].trim();
              transferTo = matchTransfer[2].trim();
            }
          }

          return {
            ...t,
            category_name: t.category_name || t.category || (isTransfer ? 'Pindah Saldo' : isFromSavings ? 'Pakai Tabungan' : 'Umum'),
            main_category: t.main_category || (t.type === 'income' ? 'income' : (isFromSavings ? 'savings' : 'needs')),
            category_id: t.category_id || null,
            wallet_name: wallet || transferFrom || 'Kas / Tunai',
            is_from_savings: isFromSavings,
            is_transfer: isTransfer,
            transfer_from: transferFrom,
            transfer_to: transferTo
          };
        });
      };

      if (monthError) throw monthError;
      const formattedMonth = formatTxList(monthData || []);
      setTransactions(formattedMonth);
      localStorage.setItem(`FINFLOW_CACHE_TX_${user.id}_${selectedMonthYear}`, JSON.stringify(formattedMonth));
      setIsOffline(false);

      // 2. Ambil seluruh transaksi untuk analitik multi-bulan (maksimal 6 bulan terakhir)
      const { data: allData, error: allError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!allError && allData) {
        const formattedAll = formatTxList(allData || []);
        setAllTransactions(formattedAll);
        localStorage.setItem(`FINFLOW_CACHE_ALL_TX_${user.id}`, JSON.stringify(formattedAll));
      }
    } catch (err: any) {
      console.error('Error fetching transactions (menggunakan cache lokal jika ada):', err);
      const cachedMonth = localStorage.getItem(`FINFLOW_CACHE_TX_${user.id}_${selectedMonthYear}`);
      const cachedAll = localStorage.getItem(`FINFLOW_CACHE_ALL_TX_${user.id}`);
      if (cachedMonth) {
        try {
          setTransactions(JSON.parse(cachedMonth));
          setIsOffline(true);
          setError(null);
        } catch {}
      } else {
        setError(err.message || 'Gagal mengambil data transaksi');
      }
      if (cachedAll) {
        try {
          setAllTransactions(JSON.parse(cachedAll));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonthYear]);

  // Pantau status koneksi online / offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (user) {
        fetchCategories();
        fetchBudgetSettings();
        fetchTransactions();
      }
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, fetchCategories, fetchBudgetSettings, fetchTransactions]);

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

  // Tambah Transaksi Baru (Termasuk Mutasi / Pindah Saldo Antar Dompet)
  const addTransaction = async (txData: {
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    title: string;
    main_category: MainCategory;
    category_name: string;
    category_id?: string | null;
    wallet_name?: string;
    is_from_savings?: boolean;
    is_transfer?: boolean;
    transfer_from?: string;
    transfer_to?: string;
    date: string;
    notes?: string;
  }) => {
    if (!user) return { error: new Error('User tidak ditemukan'), data: null };

    try {
      const isTransfer = txData.is_transfer || txData.type === 'transfer';
      const actualType: 'income' | 'expense' = isTransfer ? 'expense' : (txData.type as 'income' | 'expense');
      const actualMainCategory: MainCategory = isTransfer ? 'needs' : txData.main_category;
      const selectedWallet = isTransfer
        ? (txData.transfer_from || txData.wallet_name || 'Kas / Tunai')
        : (txData.wallet_name || 'Kas / Tunai');
      const walletTag = `[Dompet: ${selectedWallet}]`;

      let cleanNotes = txData.notes || txData.title;
      if (isTransfer) {
        const routeTag = `[Pindah Saldo: ${txData.transfer_from || selectedWallet} -> ${txData.transfer_to || 'Kas / Tunai'}]`;
        cleanNotes = `${routeTag} ${cleanNotes}`;
      } else if (txData.is_from_savings && !cleanNotes.includes('[Pakai Tabungan]')) {
        cleanNotes = `[Pakai Tabungan] ${cleanNotes}`;
      }
      const combinedNotes = `${walletTag} ${cleanNotes}`.trim();

      const payload: Record<string, any> = {
        user_id: user.id,
        type: actualType,
        amount: txData.amount,
        title: txData.title,
        main_category: actualMainCategory,
        category_name: txData.category_name,
        category: txData.category_name, // fallback untuk tabel Supabase versi lama
        date: txData.date,
        notes: combinedNotes,
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
        const formattedTx: Transaction = {
          ...(data as Transaction),
          wallet_name: selectedWallet,
          is_from_savings: Boolean(txData.is_from_savings || combinedNotes.includes('[Pakai Tabungan]')),
          is_transfer: isTransfer,
          transfer_from: txData.transfer_from,
          transfer_to: txData.transfer_to
        };

        // Jika transaksi jatuh pada bulan yang sedang dilihat
        if (data.date.startsWith(selectedMonthYear)) {
          setTransactions((prev) => [formattedTx, ...prev]);
        }
        setAllTransactions((prev) => [formattedTx, ...prev]);

        // Jika transaksi berupa pemasukan dan bukan transfer pada bulan terpilih, akumulasikan totalnya
        if (data.type === 'income' && !isTransfer && data.date.startsWith(selectedMonthYear)) {
          const currentMonthIncomeTx = [formattedTx, ...transactions]
            .filter((t) => t.type === 'income' && !t.is_transfer && t.date.startsWith(selectedMonthYear));
          const totalMonthIncome = currentMonthIncomeTx.reduce((sum, t) => sum + Number(t.amount), 0);
          saveBudgetSettings({ monthly_income: totalMonthIncome });
        }

        return { error: null, data: formattedTx };
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
      const txToDelete = transactions.find((t) => t.id === id);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setAllTransactions((prev) => prev.filter((t) => t.id !== id));

      // Jika yang dihapus adalah transaksi pemasukan, update kembali monthly_income
      if (txToDelete?.type === 'income' && !txToDelete.is_transfer && txToDelete.date.startsWith(selectedMonthYear)) {
        const remainingMonthIncome = transactions
          .filter((t) => t.id !== id && t.type === 'income' && !t.is_transfer && t.date.startsWith(selectedMonthYear))
          .reduce((sum, t) => sum + Number(t.amount), 0);
        saveBudgetSettings({ monthly_income: remainingMonthIncome });
      }

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
    // Total income: akumulasi seluruh transaksi pemasukan bulan ini (transfer dikecualikan)
    const incomeFromTransactions = transactions
      .filter((t) => t.type === 'income' && !t.is_transfer)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const baseIncome = Number(budgetSettings.monthly_income || 0);
    // Jika ada transaksi pemasukan bulan ini, prioritaskan total transaksi riil; jika belum ada gunakan target baseIncome
    const totalIncome = incomeFromTransactions > 0 ? incomeFromTransactions : baseIncome;

    // Pengeluaran per kategori alokasi (transfer / mutasi antar dompet dikecualikan)
    const expenseTx = transactions.filter((t) => t.type === 'expense' && !t.is_transfer);

    // Pengeluaran yang diambil khusus dari tabungan (tidak mengurangi uang operasional belanja bulanan)
    const savingsWithdrawnMonth = expenseTx
      .filter((t) => t.is_from_savings || (t.notes && t.notes.includes('[Pakai Tabungan]')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Kebutuhan & Keinginan operasional (tidak termasuk penarikan tabungan)
    const needsExpense = expenseTx
      .filter((t) => t.main_category === 'needs' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const wantsExpense = expenseTx
      .filter((t) => t.main_category === 'wants' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsAllocated = expenseTx
      .filter((t) => t.main_category === 'savings' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = needsExpense + wantsExpense; // Pengeluaran operasional (kebutuhan + keinginan)

    // Pagu Anggaran berdasarkan persentase
    const budgetNeeds = Math.round((totalIncome * budgetSettings.needs_percentage) / 100);
    const budgetWants = Math.round((totalIncome * budgetSettings.wants_percentage) / 100);
    const budgetSavings = Math.round((totalIncome * budgetSettings.savings_percentage) / 100);

    const remainingNeedsBudget = budgetNeeds - needsExpense;
    const remainingWantsBudget = budgetWants - wantsExpense;
    const remainingTotalBudget = (budgetNeeds + budgetWants) - totalExpense;

    // Uang belanja operasional bulanan (dipisahkan murni dari tabungan)
    const monthlyOperationalBudget = budgetNeeds + budgetWants;
    const monthlyOperationalSpent = totalExpense;
    const monthlyOperationalRemaining = monthlyOperationalBudget - monthlyOperationalSpent;

    // Rasio menabung realisasi
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((savingsAllocated + Math.max(0, netSavings - savingsAllocated)) / totalIncome) * 100 : 0;

    // Total hari & Sisa hari dalam bulan berjalan
    const { totalDays, daysLeft } = getMonthDaysInfo(selectedMonthYear);

    // Total uang bulanan acuan limit harian & mingguan (fokus pada uang operasional belanja bulanan)
    const totalMonthlyMoney = monthlyOperationalBudget > 0 ? monthlyOperationalBudget : totalIncome;

    // 1. Limit Harian = Total uang belanja bulanan dibagi total hari dalam 1 bulan
    const dailyLimit = totalDays > 0 ? Math.round(totalMonthlyMoney / totalDays) : 0;

    // 2. Limit Mingguan = Limit Harian dikali 7 hari
    const weeklyLimit = dailyLimit * 7;

    // Pengeluaran Hari Ini (Expenses dengan tanggal hari ini, tidak termasuk pos tabungan / penarikan tabungan)
    const todayStr = new Date().toISOString().split('T')[0];
    const spentToday = expenseTx
      .filter((t) => t.date === todayStr && t.main_category !== 'savings' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remainingToday = dailyLimit - spentToday;

    // Pengeluaran Minggu Ini (Senin sampai hari ini, tidak termasuk pos tabungan / penarikan tabungan)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    const spentThisWeek = expenseTx
      .filter((t) => t.date >= mondayStr && t.date <= todayStr && t.main_category !== 'savings' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remainingThisWeek = weeklyLimit - spentThisWeek;

    // Smart Alert Levels
    const alertDaily = getAlertStatus(spentToday, dailyLimit);
    const alertWeekly = getAlertStatus(spentThisWeek, weeklyLimit);
    const alertMonthly = getAlertStatus(totalExpense, budgetNeeds + budgetWants);

    // =========================================================================
    // KALKULASI TABUNGAN AKUMULATIF (DIPISAHKAN DARI UANG BULANAN)
    // Sisa uang operasional dari bulan-bulan lalu otomatis masuk ke Tabungan!
    // =========================================================================
    const monthKeys = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.date && t.date.length >= 7) monthKeys.add(t.date.substring(0, 7));
    });
    allBudgetSettings.forEach((s) => {
      if (s.month_year) monthKeys.add(s.month_year);
    });

    let pastMonthsSavings = 0;
    let pastMonthsUnspentSurplus = 0;
    let previousMonthCarryover = 0;

    monthKeys.forEach((m) => {
      if (m < selectedMonthYear) {
        const mSetting = allBudgetSettings.find((s) => s.month_year === m);
        const mIncomeSetting = Number(mSetting?.monthly_income || 0);
        const mNeedsPct = Number(mSetting?.needs_percentage || 50);
        const mWantsPct = Number(mSetting?.wants_percentage || 20);
        const mSavingsPct = Number(mSetting?.savings_percentage || 30);

        const mTx = allTransactions.filter((t) => t.date && t.date.startsWith(m) && !t.is_transfer);
        const mIncomeTx = mTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const mIncome = Math.max(mIncomeSetting, mIncomeTx);

        const mNeedsBudget = Math.round((mIncome * mNeedsPct) / 100);
        const mWantsBudget = Math.round((mIncome * mWantsPct) / 100);
        const mSavingsBudget = Math.round((mIncome * mSavingsPct) / 100);

        const mNeedsSpent = mTx
          .filter((t) => t.type === 'expense' && t.main_category === 'needs' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
          .reduce((s, t) => s + Number(t.amount), 0);
        const mWantsSpent = mTx
          .filter((t) => t.type === 'expense' && t.main_category === 'wants' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
          .reduce((s, t) => s + Number(t.amount), 0);
        const mSavingsSpent = mTx
          .filter((t) => t.type === 'expense' && t.main_category === 'savings' && !t.is_from_savings && !(t.notes && t.notes.includes('[Pakai Tabungan]')))
          .reduce((s, t) => s + Number(t.amount), 0);

        pastMonthsSavings += Math.max(mSavingsBudget, mSavingsSpent);

        // Uang berlebih dari kebutuhan & keinginan di akhir bulan langsung masuk tabungan
        const mUnspentSurplus = Math.max(0, (mNeedsBudget + mWantsBudget) - (mNeedsSpent + mWantsSpent));
        pastMonthsUnspentSurplus += mUnspentSurplus;

        const mTotalExpense = mNeedsSpent + mWantsSpent + mSavingsSpent;
        previousMonthCarryover += (mIncome - mTotalExpense);
      }
    });

    // Tabungan bulan berjalan yang disisihkan
    const currentMonthPlannedSavings = Math.max(budgetSavings, savingsAllocated);

    // Total seluruh penarikan / pemakaian uang dari tabungan sepanjang waktu
    const lifetimeSavingsWithdrawn = allTransactions
      .filter((t) => !t.is_transfer && t.type === 'expense' && (t.is_from_savings || (t.notes && t.notes.includes('[Pakai Tabungan]'))))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Total Tabungan Terakumulasi Bersih (termasuk surplus akhir bulan yang otomatis masuk):
    const totalSavingsAccumulated = Math.max(
      0,
      pastMonthsSavings + pastMonthsUnspentSurplus + currentMonthPlannedSavings - lifetimeSavingsWithdrawn
    );

    // Total modal awal dari semua dompet yang didaftarkan
    const totalWalletsInitialBalance = wallets.reduce((sum, w) => sum + Number(w.initial_balance || 0), 0);

    // Total saldo kas sepanjang masa (Lifetime seluruh transaksi + modal awal dompet)
    const lifetimeIncome = allTransactions
      .filter((t) => !t.is_transfer && t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const lifetimeExpense = allTransactions
      .filter((t) => !t.is_transfer && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const lifetimeTotalBalance = totalWalletsInitialBalance + lifetimeIncome - lifetimeExpense;

    // Total Uang Kas Nyata Kumulatif (Identik dengan total seluruh saldo dompet saat ini)
    const cumulativeTotalBalance = lifetimeTotalBalance;

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
      cumulative_total_balance: cumulativeTotalBalance,
      previous_month_carryover: previousMonthCarryover,
      lifetime_total_balance: lifetimeTotalBalance,
      monthly_operational_budget: monthlyOperationalBudget,
      monthly_operational_spent: monthlyOperationalSpent,
      monthly_operational_remaining: monthlyOperationalRemaining,
      total_savings_accumulated: totalSavingsAccumulated,
      savings_withdrawn_total: lifetimeSavingsWithdrawn,
      total_all_money: lifetimeTotalBalance,
      alert_level_daily: alertDaily,
      alert_level_weekly: alertWeekly,
      alert_level_monthly: alertMonthly
    };
  }, [transactions, budgetSettings, selectedMonthYear, allTransactions, allBudgetSettings, wallets]);

  // =========================================================================
  // ANALISIS PERBANDINGAN ANTAR BULAN (MONTH-OVER-MONTH DATA)
  // =========================================================================
  const monthlyComparison = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number; savings: number }>();

    allTransactions.forEach((t) => {
      if (t.is_transfer) return;
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
      .filter((t) => !t.is_transfer && t.type === 'expense' && t.main_category !== 'savings')
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

  // Kalkulasi Saldo Dompet Real-Time (Termasuk Mutasi / Pindah Saldo Antar Dompet)
  const walletsWithBalances = useMemo(() => {
    return wallets.map((w) => {
      const wName = w.name.toLowerCase();
      const isDefault = Boolean(w.is_default);

      // 1. Transaksi reguler (bukan transfer)
      const regularTx = allTransactions.filter((t) => {
        if (t.is_transfer) return false;
        const notesStr = t.notes || '';
        if (notesStr.includes('[Pindah Saldo:') || notesStr.includes('[Transfer:')) return false;

        const tWallet = (t.wallet_name || 'Kas / Tunai').toLowerCase();
        return tWallet === wName || (isDefault && (tWallet === 'kas / tunai' || !t.wallet_name));
      });

      const totalIn = regularTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalOut = regularTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // 2. Transfer Masuk (Saldo masuk ke dompet tujuan ini)
      const transferInTx = allTransactions.filter((t) => {
        const isTransfer = Boolean(
          t.is_transfer ||
          (t.notes && (t.notes.includes('[Pindah Saldo:') || t.notes.includes('[Transfer:')))
        );
        if (!isTransfer) return false;
        const toWallet = (t.transfer_to || '').toLowerCase();
        return toWallet === wName || (isDefault && toWallet === 'kas / tunai');
      });
      const transferIn = transferInTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // 3. Transfer Keluar (Saldo berkurang dari dompet asal ini)
      const transferOutTx = allTransactions.filter((t) => {
        const isTransfer = Boolean(
          t.is_transfer ||
          (t.notes && (t.notes.includes('[Pindah Saldo:') || t.notes.includes('[Transfer:')))
        );
        if (!isTransfer) return false;
        const fromWallet = (t.transfer_from || t.wallet_name || '').toLowerCase();
        return fromWallet === wName || (isDefault && (fromWallet === 'kas / tunai' || !fromWallet));
      });
      const transferOut = transferOutTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const currentBalance = Number(w.initial_balance || 0) + totalIn + transferIn - totalOut - transferOut;

      return {
        ...w,
        current_balance: currentBalance,
        total_in: totalIn + transferIn,
        total_out: totalOut + transferOut,
        transaction_count: regularTx.length + transferInTx.length + transferOutTx.length
      };
    });
  }, [wallets, allTransactions]);

  // Eksekusi / Proses Tagihan Rutin ke Bulan Terpilih
  const processRecurring = async (recId: string) => {
    const rec = recurringList.find((r) => r.id === recId);
    if (!rec) return { error: new Error('Tagihan rutin tidak ditemukan'), data: null };

    const [year, month] = selectedMonthYear.split('-');
    const targetDay = String(Math.min(rec.day_of_month || 1, 28)).padStart(2, '0');
    const txDate = `${year}-${month}-${targetDay}`;

    const res = await addTransaction({
      type: rec.type,
      amount: rec.amount,
      title: rec.title,
      main_category: rec.main_category,
      category_name: rec.category_name,
      wallet_name: rec.wallet_name || 'Kas / Tunai',
      date: txDate,
      notes: `[Tagihan Rutin ${rec.frequency}] ${rec.notes || rec.title}`
    });

    if (!res.error) {
      const updated = recurringList.map((r) =>
        r.id === recId ? { ...r, last_processed_month: selectedMonthYear } : r
      );
      saveRecurring(updated);
    }
    return res;
  };

  return {
    transactions,
    allTransactions,
    budgetSettings,
    categories,
    loading,
    error,
    isOffline,
    wallets: walletsWithBalances,
    addWallet,
    deleteWallet,
    updateWallet,
    recurringList,
    addRecurring,
    deleteRecurring,
    toggleRecurring,
    processRecurring,
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
