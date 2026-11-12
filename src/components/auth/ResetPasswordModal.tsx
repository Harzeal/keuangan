import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ResetPasswordModalProps {
  onClose: () => void;
}

const DIRECT_RESET_SQL = `CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.reset_password_direct(
    target_email TEXT,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF length(trim(new_password)) < 6 THEN
        RAISE EXCEPTION 'Kata sandi baru minimal 6 karakter.';
    END IF;

    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = lower(trim(target_email))
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Email tidak ditemukan atau belum terdaftar.';
    END IF;

    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_user_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_password_direct(TEXT, TEXT) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';`;

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose }) => {
  const { resetPassword, resetPasswordDirect, verifyRecoveryOtp } = useAuth();
  const [mode, setMode] = useState<'direct' | 'email'>('direct');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSqlSetup, setNeedsSqlSetup] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Tutup modal ketika tombol Escape (ESC) ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(DIRECT_RESET_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsSqlSetup(false);

    if (!email.trim()) {
      setError('Masukkan alamat email Anda.');
      return;
    }

    if (mode === 'direct') {
      if (!newPassword || newPassword.length < 6) {
        setError('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }

      setLoading(true);
      try {
        const { error: directErr, needsSqlSetup: sqlMissing } = await resetPasswordDirect(
          email,
          newPassword
        );
        if (directErr) {
          if (sqlMissing) {
            setNeedsSqlSetup(true);
            setError(
              'Fungsi SQL reset langsung belum diaktifkan di Supabase Anda. Salin kode SQL di bawah lalu klik Run di SQL Editor Supabase (cukup 1 kali saja).'
            );
          } else {
            setError(directErr.message);
          }
        } else {
          setSubmitted(true);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal mereset kata sandi.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode Email
    setLoading(true);
    try {
      const { error: emailErr } = await resetPassword(email);
      if (emailErr) {
        if (
          emailErr.message.toLowerCase().includes('rate limit') ||
          emailErr.message.toLowerCase().includes('60 seconds')
        ) {
          setError(
            'Batas pengiriman email gratis Supabase tercapai (rate limit). Silakan gunakan tab "Reset Langsung (Tanpa Email)" di atas agar langsung berhasil!'
          );
        } else {
          setError(emailErr.message);
        }
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim instruksi reset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim()) return;
    setError(null);
    setVerifyingOtp(true);
    try {
      const { error: otpErr } = await verifyRecoveryOtp(email, otpToken);
      if (otpErr) {
        setError('Kode OTP tidak valid atau sudah kadaluarsa.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi kode OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 pb-8 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative text-white my-4"
      >
        <button
          onClick={onClose}
          title="Tutup (Esc)"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Atur Ulang Kata Sandi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ubah kata sandi akun Anda secara langsung tanpa terkendala batas pengiriman email.
          </p>
        </div>

        {/* Pilihan Mode Reset */}
        {!submitted && (
          <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl border border-slate-700/60 mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('direct');
                setError(null);
              }}
              className={`py-2 px-2 rounded-lg transition ${
                mode === 'direct'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reset Langsung (Instan)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('email');
                setError(null);
                setNeedsSqlSetup(false);
              }}
              className={`py-2 px-2 rounded-lg transition ${
                mode === 'email'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Via Link Email
            </button>
          </div>
        )}

        {submitted ? (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            {mode === 'direct' ? (
              <>
                <h3 className="font-bold text-base text-white">
                  Kata Sandi Berhasil Diperbarui!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kata sandi untuk <b className="text-emerald-400">{email}</b> telah berhasil diganti. Silakan langsung masuk (Login) dengan kata sandi baru Anda.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-base text-white">Email Telah Dikirim!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tautan reset telah dikirimkan ke <b className="text-indigo-400">{email}</b>. Silakan klik tautan di kotak masuk/spam email Anda.
                </p>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={handleVerifyOtp}
                  className="pt-2 border-t border-slate-700/70 text-left space-y-2"
                >
                  <label className="block text-[11px] font-semibold text-slate-400">
                    Punya Kode Token / OTP dari Email? (Opsional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan kode 6 digit"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={verifyingOtp || !otpToken.trim()}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-xs font-bold text-white transition"
                    >
                      {verifyingOtp ? '...' : 'Verifikasi'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <button
              onClick={onClose}
              className="w-full mt-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-bold text-white transition"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {needsSqlSetup && (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-indigo-300">
                    Aktifkan Fungsi SQL di Supabase (1x Saja):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                    </button>
                    <a
                      href="https://supabase.com/dashboard/project/sxwnweslamgdegmjsznm/sql/new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <span>SQL Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded-xl overflow-x-auto max-h-32">
                  {DIRECT_RESET_SQL}
                </pre>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Akun Terdaftar</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="fauzan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {mode === 'direct' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Ulangi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Ketik ulang kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700/60 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'direct' ? 'Simpan Password Baru' : 'Kirim Tautan'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
