import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabase(): SupabaseClient | null {
  const url = "https://kdarnnjsexoexncbazvr.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYXJubmpzZXhvZXhuY2JhenZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk3Njg4OCwiZXhwIjoyMTAyNTUyODg4fQ.KJGqZ4XPGgHGg5vZdU7ckDZJJjJLSe0qOZ7TSvYHfGk";
  
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isSupabaseConfigured() {
  return true;
}
