import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Landmark,
  Smartphone,
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import { Wallet, WalletType } from '../../types/database';
import { formatRupiah, parseRupiahInput } from '../../lib/utils';

interface WalletOverviewCardProps {
  wallets: (Wallet & { current_balance: number; total_in: number; total_out: number; transaction_count: number })[];
  privacyMode: boolean;
  onAddWallet: (wallet: Omit<Wallet, 'id'>) => void;
  onDeleteWallet: (id: string) => void;
  onUpdateWallet?: (wallet: Wallet) => void;
  onOpenTransfer?: () => void;
  selectedWalletFilter?: string | null;
  onSelectWalletFilter?: (walletName: string | null) => void;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({
  wallets,
  privacyMode,
  onAddWallet,
  onDeleteWallet,
  onUpdateWallet,
  onOpenTransfer,
  selectedWalletFilter,
  onSelectWalletFilter
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<WalletType>('bank');
  const [newWalletBalanceStr, setNewWalletBalanceStr] = useState('');
  const [newWalletColor, setNewWalletColor] = useState('#3b82f6');

  // State untuk Edit Dompet
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<WalletType>('bank');
  const [editBalanceStr, setEditBalanceStr] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');

  const openEditModal = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setEditName(wallet.name);
    setEditType(wallet.type);
    setEditBalanceStr(wallet.initial_balance ? formatRupiah(wallet.initial_balance) : '');
    setEditColor(wallet.color || '#3b82f6');
  };

  const handleUpdateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !onUpdateWallet) return;
    onUpdateWallet({
      ...editingWallet,
      name: editName.trim() || editingWallet.name,
      type: editType,
      initial_balance: parseRupiahInput(editBalanceStr),
      color: editColor
    });
    setEditingWallet(null);
  };

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-5 h-5" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5" />;
      case 'cash':
        return <WalletIcon className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    onAddWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      initial_balance: parseRupiahInput(newWalletBalanceStr),
      color: newWalletColor,
      icon: newWalletType === 'bank' ? 'Landmark' : newWalletType === 'ewallet' ? 'Smartphone' : 'Wallet'
    });

    setNewWalletName('');
    setNewWalletBalanceStr('');
    setIsAddModalOpen(false);
  };

  const totalAllWallets = wallets.reduce((sum, w) => sum + (w.current_balance || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>Dompet & Rekening</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {wallets.length} Sumber Dana
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola alokasi saldo uang tunai, bank, dan e-wallet secara terpisah
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {selectedWalletFilter && onSelectWalletFilter && (
            <button
              onClick={() => onSelectWalletFilter(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition"
            >
              Reset Filter
            </button>
          )}

          {onOpenTransfer && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenTransfer}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Pindah Saldo</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dompet</span>
          </motion.button>
        </div>
      </div>

      {/* Grid of Wallets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {wallets.map((wallet) => {
          const isSelected = selectedWalletFilter === wallet.name;

          return (
            <motion.div
              key={wallet.id}
              whileHover={{ y: -2 }}
              onClick={() => onSelectWalletFilter && onSelectWalletFilter(isSelected ? null : wallet.name)}
              className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                  : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: wallet.color || '#4f46e5' }}
                  >
                    {getWalletIcon(wallet.type)}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {wallet.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {wallet.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onUpdateWallet && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(wallet);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                      title="Edit Dompet & Saldo Awal"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!wallet.is_default && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus dompet '${wallet.name}'?`)) {
                          onDeleteWallet(wallet.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Hapus Dompet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Saldo Saat Ini */}
              <div className="mt-2">
                <span className="text-[10px] text-slate-400 font-medium block">Saldo Saat Ini</span>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {privacyMode ? '••••••••' : formatRupiah(wallet.current_balance || 0)}
                </p>
              </div>

              {/* Arus Kas Masuk / Keluar */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  +{privacyMode ? '•••' : formatRupiah(wallet.total_in || 0)}
                </span>
                <span className="flex items-center gap-1 text-rose-500 font-semibold">
                  <TrendingDown className="w-3 h-3" />
                  -{privacyMode ? '•••' : formatRupiah(wallet.total_out || 0)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Tambah Dompet */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Tambah Dompet / Akun Bank Baru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Tambahkan akun rekening atau e-wallet untuk melacak arus kas per kantong uang
              </p>

              <form onSubmit={handleCreateWallet} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Nama Dompet / Bank
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bank BCA, Dana, Jago"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tipe
                    </label>
                    <select
                      value={newWalletType}
                      onChange={(e) => setNewWalletType(e.target.value as WalletType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="bank">Rekening Bank</option>
                      <option value="ewallet">E-Wallet</option>
                      <option value="cash">Uang Tunai</option>
                      <option value="investment">Investasi</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Warna Label
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewWalletColor(c)}
                          className={`w-6 h-6 rounded-full transition ${
                            newWalletColor === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Saldo Awal (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Rp 0"
                    value={newWalletBalanceStr}
                    onChange={(e) => {
                      const num = parseRupiahInput(e.target.value);
                      setNewWalletBalanceStr(num > 0 ? formatRupiah(num) : '');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition"
                  >
                    Simpan Dompet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Edit Dompet & Saldo Awal */}
        {editingWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Edit Dompet / Rekening
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Sesuaikan nama, tipe, warna, atau saldo awal dompet ini
              </p>

              <form onSubmit={handleUpdateWallet} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Nama Dompet / Bank
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama dompet"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tipe
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as WalletType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="bank">Rekening Bank</option>
                      <option value="ewallet">E-Wallet</option>
                      <option value="cash">Uang Tunai</option>
                      <option value="investment">Investasi</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Warna Label
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-6 h-6 rounded-full transition ${
                            editColor === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Saldo Awal
                  </label>
                  <input
                    type="text"
                    placeholder="Rp 0"
                    value={editBalanceStr}
                    onChange={(e) => {
                      const num = parseRupiahInput(e.target.value);
                      setEditBalanceStr(num > 0 ? formatRupiah(num) : '');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Saldo awal yang Anda miliki di dompet ini sebelum transaksi dicatat.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingWallet(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
