import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let clientKey = '';

export function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NODE_ENV === 'production' ? '' : process.env.SUPABASE_ANON_KEY || '');
  if (!url || !key) return null;
  const normalized = normalizeSupabaseUrl(url);
  if (!client || clientKey !== key || client.supabaseUrl !== normalized) {
    client = createClient(normalized, key, { auth: { persistSession: false, autoRefreshToken: false } });
    clientKey = key;
  }
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NODE_ENV !== 'production' && process.env.SUPABASE_ANON_KEY)));
}
