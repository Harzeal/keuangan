import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  resetPasswordDirect: (email: string, newPassword: string) => Promise<{ error: Error | null; needsSqlSetup?: boolean }>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tangkap parameter URL awal sebelum @supabase/supabase-js membersihkan hash/query
const INITIAL_HASH = typeof window !== 'undefined' ? window.location.hash : '';
const INITIAL_SEARCH = typeof window !== 'undefined' ? window.location.search : '';

const checkUrlIsRecovery = () => {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  return (
    INITIAL_HASH.includes('type=recovery') ||
    INITIAL_HASH.includes('reset-password') ||
    INITIAL_SEARCH.includes('type=recovery') ||
    INITIAL_SEARCH.includes('reset=recovery') ||
    hash.includes('type=recovery') ||
    hash.includes('reset-password') ||
    search.includes('type=recovery') ||
    search.includes('reset=recovery')
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => checkUrlIsRecovery());

  // Ambil profil dari tabel public.profiles
  const fetchProfile = async (userId: string, userEmail?: string, metaFullName?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Gagal memuat profil dari Supabase:', error.message);
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Fallback jika profile belum dibuat oleh trigger
        const fallbackProfile: UserProfile = {
          id: userId,
          email: userEmail || null,
          full_name: metaFullName || userEmail?.split('@')[0] || 'Pengguna FinFlow',
          avatar_url: null,
          currency: 'IDR'
        };
        setProfile(fallbackProfile);

        // Coba insert profile jika belum ada
        try {
          await supabase.from('profiles').upsert(fallbackProfile);
        } catch {}
      }
    } catch (err) {
      console.error('Error saat fetch profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuthAndRecovery = async () => {
      // 1. Cek apakah URL dibuka dari tautan recovery / reset password di email
      if (checkUrlIsRecovery()) {
        setIsPasswordRecovery(true);
      }

      // 2. Perbaiki bila ada double-hash (misal: /#reset-password#access_token=...&refresh_token=...)
      const rawHash = INITIAL_HASH || window.location.hash;
      if (rawHash.includes('access_token=')) {
        const cleanQuery = rawHash.replace(/^#reset-password#?/, '').replace(/^#/, '');
        const hashParams = new URLSearchParams(cleanQuery);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        if (type === 'recovery') {
          setIsPasswordRecovery(true);
        }
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
        }
      }

      // 3. Tangani bila email menggunakan parameter query ?token_hash=...&type=recovery atau ?code=...
      const searchParams = new URLSearchParams(INITIAL_SEARCH || window.location.search);
      const tokenHash = searchParams.get('token_hash');
      const queryType = searchParams.get('type');
      const pkceCode = searchParams.get('code');

      if (tokenHash && queryType === 'recovery') {
        setIsPasswordRecovery(true);
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });
      } else if (pkceCode) {
        await supabase.auth.exchangeCodeForSession(pkceCode);
      }

      // 4. Ambil sesi aktif pertama kali
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchProfile(
          currentSession.user.id,
          currentSession.user.email,
          currentSession.user.user_metadata?.full_name
        );
      }
      if (mounted) setLoading(false);
    };

    initAuthAndRecovery();

    // Pasang listener auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Jika event reset password terpantau
        if (event === 'PASSWORD_RECOVERY' || checkUrlIsRecovery()) {
          setIsPasswordRecovery(true);
        }

        if (newSession?.user) {
          await fetchProfile(
            newSession.user.id,
            newSession.user.email,
            newSession.user.user_metadata?.full_name
          );
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim()
          },
          // Arahkan verifikasi email langsung ke domain web online yang sedang dibuka
          emailRedirectTo: `${window.location.origin}`
        }
      });
      return { error, user: data.user };
    } catch (err: any) {
      return { error: err, user: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      // Gunakan origin murni tanpa hash ganda agar cocok dengan Site URL Supabase & tidak merusak #access_token
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}`
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const resetPasswordDirect = async (email: string, newPassword: string) => {
    try {
      const { error } = await supabase.rpc('reset_password_direct', {
        target_email: email.trim(),
        new_password: newPassword
      });
      if (error) {
        const msg = error.message || '';
        const needsSqlSetup =
          error.code === 'PGRST202' ||
          msg.includes('Could not find the function') ||
          msg.includes('reset_password_direct');
        return { error: new Error(msg), needsSqlSetup };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const verifyRecoveryOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'recovery'
      });
      if (!error) {
        setIsPasswordRecovery(true);
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User belum terautentikasi') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata?.full_name);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isPasswordRecovery,
        setIsPasswordRecovery,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resetPasswordDirect,
        verifyRecoveryOtp,
        updatePassword,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};
