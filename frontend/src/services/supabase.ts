/**
 * Supabase client — frontend instance.
 *
 * Uses ONLY the publishable anon key.
 * Access is governed by Row Level Security, not key secrecy.
 *
 * ⚠️ NEVER import or use the service-role key here.
 * ⚠️ NEVER use this client for privileged operations.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Our World] Supabase env vars not set. ' +
    'Copy frontend/.env.example to frontend/.env.local and fill in your values.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      // Store session in localStorage for persistence across tabs
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export type { User, Session } from '@supabase/supabase-js';
