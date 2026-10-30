import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sxwnweslamgdegmjsznm.supabase.co';
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-wmXwhcY9XqedENRsuE5fw_NyxUXLZO';

export const getStoredCredentials = () => {
  const customUrl = localStorage.getItem('FINFLOW_SUPABASE_URL');
  const customKey = localStorage.getItem('FINFLOW_SUPABASE_KEY');

  return {
    url: customUrl && customUrl.trim() !== '' ? customUrl.trim() : DEFAULT_URL,
    key: customKey && customKey.trim() !== '' ? customKey.trim() : DEFAULT_KEY,
    isCustom: Boolean(customUrl || customKey)
  };
};

export const saveCustomCredentials = (url: string, key: string) => {
  if (url) localStorage.setItem('FINFLOW_SUPABASE_URL', url.trim());
  if (key) localStorage.setItem('FINFLOW_SUPABASE_KEY', key.trim());
  window.location.reload();
};

export const resetCredentials = () => {
  localStorage.removeItem('FINFLOW_SUPABASE_URL');
  localStorage.removeItem('FINFLOW_SUPABASE_KEY');
  window.location.reload();
};

const creds = getStoredCredentials();

export const supabase: SupabaseClient = createClient(creds.url, creds.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
