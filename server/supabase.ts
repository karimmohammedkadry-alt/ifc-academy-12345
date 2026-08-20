import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || "https://kdarnnjsexoexncbazvr.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_dxeq5Y36oMEHRF0OuLT0IQ_SL8Iz_aA";
  
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isSupabaseConfigured() {
  return true;
}
