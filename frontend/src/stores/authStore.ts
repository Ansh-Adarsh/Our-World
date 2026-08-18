/**
 * Auth store — global authentication state.
 * Uses Zustand for lightweight, reactive state management.
 * Listens to Supabase auth state changes and keeps store in sync.
 *
 * Also holds the onboarding journey state. That state is read from the
 * `profiles` row on every load (server-authoritative), never from a local flag,
 * so the app can always tell a brand-new user from a returning one.
 */
import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { createCouple } from '@/services/api';
import {
  normalizeJourneyState,
  persistJourneyStatus,
  persistJourneyStep,
} from '@/services/onboardingService';
import type { AuthUser, Couple, OnboardingStatus, Profile } from '@/types';

interface AuthStore {
  user: AuthUser | null;
  couple: Couple | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  /**
   * Where this user is in the guided journey.
   *
   * Defaults to 'completed' so no unauthenticated or still-loading render can
   * ever flash the journey at someone. It only becomes a journey value once a
   * profile row has actually been read and says so.
   */
  onboardingStatus: OnboardingStatus;
  /** Resume point inside the question game. */
  onboardingStep: number;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadCouple: () => Promise<void>;
  advanceJourney: (status: OnboardingStatus) => Promise<void>;
  setJourneyStep: (step: number) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  couple: null,
  isLoading: true,
  isAuthenticated: false,
  onboardingStatus: 'completed',
  onboardingStep: 0,

  // ─── Initialize ────────────────────────────────────────────────────────────
  initialize: async () => {
    set({ isLoading: true });

    // Get existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      await hydrateSession(session.user.id, session.user.email, set);
      await get().loadCouple();
    }

    set({ isLoading: false });

    // Listen for future auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await hydrateSession(session.user.id, session.user.email, set);
        await get().loadCouple();
      } else {
        set({
          user: null,
          couple: null,
          isAuthenticated: false,
          onboardingStatus: 'completed',
          onboardingStep: 0,
        });
      }
    });
  },

  // ─── Sign In ───────────────────────────────────────────────────────────────
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    // Journey state arrives via onAuthStateChange → hydrateSession, which is
    // what decides whether this person sees the journey or the dashboard.
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
        // Non-fatal — backend may not be running
        console.warn('[AuthStore] Could not create couple:', coupleError);
      }
      // The signup trigger writes onboarding_status = 'not_started', so the
      // route guard sends this user into the journey. Re-read to pick it up.
      await hydrateSession(data.session.user.id, data.session.user.email, set);
      await get().loadCouple();
    }
  },

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      couple: null,
      isAuthenticated: false,
      onboardingStatus: 'completed',
      onboardingStep: 0,
    });
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

  // ─── Journey: advance one stage ─────────────────────────────────────────────
  /**
   * Move the journey forward. Writes to the database first, then updates the
   * store. If the write fails the store still advances, so the experience never
   * dead-ends — but the next page load will read the last persisted stage, not
   * this optimistic one.
   */
  advanceJourney: async (status: OnboardingStatus) => {
    const userId = get().user?.id;

    if (userId) {
      const persisted = await persistJourneyStatus(userId, status);
      if (!persisted) {
        console.warn(
          `[AuthStore] Journey advanced to "${status}" in memory only — the write did not land.`,
        );
      }
    }

    set({ onboardingStatus: status, onboardingStep: status === 'not_started' ? get().onboardingStep : 0 });
  },

  // ─── Journey: remember the current question ─────────────────────────────────
  setJourneyStep: async (step: number) => {
    const safeStep = Math.max(0, step);
    set({ onboardingStep: safeStep });

    const userId = get().user?.id;
    if (userId) await persistJourneyStep(userId, safeStep);
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

type SetState = (partial: Partial<AuthStore>) => void;

/**
 * Read the profile once and derive both the user and the journey state from it,
 * then commit them in a single update so no render ever sees an authenticated
 * user with a stale journey stage.
 */
async function hydrateSession(
  userId: string,
  email: string | undefined,
  set: SetState,
): Promise<void> {
  const profile = await fetchProfile(userId);
  const journey = normalizeJourneyState(profile);

  set({
    user: { id: userId, email, profile },
    isAuthenticated: true,
    // No readable profile → treat as a returning user. Failing open keeps a
    // database hiccup from trapping someone in onboarding forever.
    onboardingStatus: journey?.status ?? 'completed',
    onboardingStep: journey?.step ?? 0,
  });
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return (data as Profile | null) ?? null;
}
