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

export const isPlaceholder = !supabaseUrl || supabaseUrl.includes('your-project-ref') || !supabaseAnonKey || supabaseAnonKey.includes('your-supabase-anon-key') || supabaseUrl.includes('placeholder.supabase.co');

if (isPlaceholder) {
  console.info(
    '[Our World] Running in local UI mode. When ready, replace placeholders in frontend/.env.local with your real Supabase project credentials.'
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
