/**
 * Auth store — global authentication state.
 * Uses Zustand for lightweight, reactive state management.
 * Listens to Supabase auth state changes and keeps store in sync.
 */
import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { createCouple } from '@/services/api';
import type { AuthUser, Couple } from '@/types';

interface AuthStore {
  user: AuthUser | null;
  couple: Couple | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadCouple: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  couple: null,
  isLoading: true,
  isAuthenticated: false,

  // ─── Initialize ────────────────────────────────────────────────────────────
  initialize: async () => {
    set({ isLoading: true });

    // Get existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({
        user: {
          id: session.user.id,
          email: session.user.email,
          profile,
        },
        isAuthenticated: true,
      });
      await get().loadCouple();
    }

    set({ isLoading: false });

    // Listen for future auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            profile,
          },
          isAuthenticated: true,
        });
        await get().loadCouple();
      } else {
        set({ user: null, couple: null, isAuthenticated: false });
      }
    });
  },

  // ─── Sign In ───────────────────────────────────────────────────────────────
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  // ─── Sign Up ───────────────────────────────────────────────────────────────
  signUp: async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    });

    if (error) throw new Error(error.message);

    // After signup, create couple via backend (uses service role, not client)
    if (data.session) {
      try {
        await createCouple({ couple_name: undefined });
      } catch (coupleError) {
        // Non-fatal in Phase 1 — backend may not be running
        console.warn('[AuthStore] Could not create couple:', coupleError);
      }
    }
  },

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, couple: null, isAuthenticated: false });
  },

  // ─── Load Couple ───────────────────────────────────────────────────────────
  loadCouple: async () => {
    const { data, error } = await supabase
      .from('couple_members')
      .select('couple_id, couples(*)')
      .single();

    if (error || !data) {
      // User may not have a couple yet — that's fine
      set({ couple: null });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set({ couple: (data as any).couples as Couple });
  },
}));

// ─── Helper ────────────────────────────────────────────────────────────────────
async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data ?? null;
}
