/**
 * Auth store — global authentication state.
 * Uses Zustand for lightweight, reactive state management.
 * Listens to Supabase auth state changes and keeps store in sync.
 *
 * Supported native Supabase Auth methods:
 * 1. Email + Password (signInWithPassword, signUp, resetPasswordForEmail)
 * 2. Phone + OTP (signInWithOtp, verifyOtp)
 * 3. OAuth (Google, Facebook)
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
   * Flag indicating the user has just successfully authenticated
   * during this session (used to show the post-login Welcome/Congratulations screen).
   */
  hasJustAuthenticated: boolean;

  /**
   * Where this user is in the guided journey.
   * Defaults to 'completed' while resolving, derived strictly from `profiles.onboarding_status`.
   */
  onboardingStatus: OnboardingStatus;
  /** Resume point inside the question game. */
  onboardingStep: number;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadCouple: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  setCouple: (couple: Couple | null) => void;
  advanceJourney: (status: OnboardingStatus) => Promise<void>;
  setJourneyStep: (step: number) => Promise<void>;
  setHasJustAuthenticated: (status: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  couple: null,
  isLoading: true,
  isAuthenticated: false,
  hasJustAuthenticated: false,
  onboardingStatus: 'completed',
  onboardingStep: 0,

  // ─── Initialize ────────────────────────────────────────────────────────────
  initialize: async () => {
    set({ isLoading: true });

    // Get existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      await hydrateSession(session.user.id, session.user.email, session.user.phone, set);
      await get().loadCouple();
    }

    set({ isLoading: false });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // If event is SIGNED_IN or USER_UPDATED, mark hasJustAuthenticated
        if (event === 'SIGNED_IN') {
          set({ hasJustAuthenticated: true });
        }
        await hydrateSession(session.user.id, session.user.email, session.user.phone, set);
        await get().loadCouple();
      } else {
        set({
          user: null,
          couple: null,
          isAuthenticated: false,
          hasJustAuthenticated: false,
          onboardingStatus: 'completed',
          onboardingStep: 0,
        });
      }
    });
  },

  // ─── Email Sign In ─────────────────────────────────────────────────────────
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(formatAuthError(error.message));
    }
    set({ hasJustAuthenticated: true });
  },

  // ─── Email Sign Up ─────────────────────────────────────────────────────────
  signUp: async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    });

    if (error) {
      throw new Error(formatAuthError(error.message));
    }

    if (data.session) {
      set({ hasJustAuthenticated: true });
      try {
        await createCouple({ couple_name: undefined });
      } catch (coupleError) {
        console.warn('[AuthStore] Could not create couple record:', coupleError);
      }
      await hydrateSession(data.session.user.id, data.session.user.email, data.session.user.phone, set);
      await get().loadCouple();
    }
  },

  // ─── Phone Sign In / Send OTP ──────────────────────────────────────────────
  signInWithOtp: async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) {
      throw new Error(formatAuthError(error.message));
    }
  },

  // ─── Phone Verify OTP ──────────────────────────────────────────────────────
  verifyOtp: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      throw new Error(formatAuthError(error.message));
    }

    if (data.session) {
      set({ hasJustAuthenticated: true });
      try {
        await createCouple({ couple_name: undefined });
      } catch (coupleError) {
        console.warn('[AuthStore] Could not create couple record:', coupleError);
      }
      await hydrateSession(data.session.user.id, data.session.user.email, data.session.user.phone, set);
      await get().loadCouple();
    }
  },

  // ─── OAuth Sign In (Google, Facebook) ──────────────────────────────────────
  signInWithOAuth: async (provider: 'google' | 'facebook') => {
    const redirectUrl = `${window.location.origin}/login`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) {
      throw new Error(formatAuthError(error.message));
    }
  },

  // ─── Reset Password ────────────────────────────────────────────────────────
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      throw new Error(formatAuthError(error.message));
    }
  },

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      couple: null,
      isAuthenticated: false,
      hasJustAuthenticated: false,
      onboardingStatus: 'completed',
      onboardingStep: 0,
    });
  },

  // ─── Load Couple ───────────────────────────────────────────────────────────
  loadCouple: async () => {
    try {
      const { data, error } = await supabase
        .from('couple_members')
        .select('couple_id, couples(*)')
        .maybeSingle();

      if (error) {
        console.error('[AuthStore] Error loading couple:', error.message);
        return;
      }

      if (!data) {
        set({ couple: null });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set({ couple: (data as any).couples as Couple });
    } catch (err) {
      console.error('[AuthStore] Exception in loadCouple:', err);
    }
  },

  // ─── Update Display Name ───────────────────────────────────────────────────
  updateDisplayName: async (displayName: string) => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new Error('Display name cannot be empty');
    }
    if (trimmed.length > 50) {
      throw new Error('Display name is too long (max 50 characters)');
    }
    const userId = get().user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('[AuthStore] Failed to update display name in database:', error.message);
        throw new Error(error.message);
      }

      // Update in-memory user profile
      const currentUser = get().user;
      if (currentUser) {
        const updatedProfile: Profile = currentUser.profile
          ? { ...currentUser.profile, display_name: trimmed }
          : {
              id: userId,
              display_name: trimmed,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
        set({
          user: {
            ...currentUser,
            profile: updatedProfile,
          },
        });
      }
    } catch (err) {
      console.error('[AuthStore] updateDisplayName error:', err);
      throw err;
    }
  },

  setCouple: (couple: Couple | null) => {
    set({ couple });
  },

  // ─── Journey: advance one stage ─────────────────────────────────────────────
  advanceJourney: async (status: OnboardingStatus) => {
    const userId = get().user?.id;

    if (userId) {
      const persisted = await persistJourneyStatus(userId, status);
      if (!persisted) {
        console.warn(`[AuthStore] Journey status "${status}" advanced in memory.`);
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

  setHasJustAuthenticated: (status: boolean) => {
    set({ hasJustAuthenticated: status });
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

type SetState = (partial: Partial<AuthStore>) => void;

/**
 * Hydrate session user and profile.
 */
async function hydrateSession(
  userId: string,
  email: string | undefined,
  phone: string | undefined,
  set: SetState,
): Promise<void> {
  const profile = await fetchProfile(userId, email, phone);
  const journey = normalizeJourneyState(profile);

  set({
    user: { id: userId, email, profile },
    isAuthenticated: true,
    onboardingStatus: journey?.status ?? 'completed',
    onboardingStep: journey?.step ?? 0,
  });
}

/**
 * Fetch profile with automatic fallback creation if freshly inserted user.
 */
async function fetchProfile(
  userId: string,
  email?: string,
  phone?: string,
): Promise<Profile | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) return data as Profile;

    // Fallback: create profile if database trigger was delayed
    const defaultName = email?.split('@')[0] || (phone ? `Partner ${phone.slice(-4)}` : 'My Love');
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: defaultName,
        onboarding_status: 'not_started',
        onboarding_step: 0,
      })
      .select('*')
      .maybeSingle();

    return (newProfile as Profile | null) ?? null;
  } catch (err) {
    console.warn('[AuthStore] fetchProfile warning:', err);
    return null;
  }
}

/**
 * Convert technical error messages to romantic, user-friendly copy.
 */
function formatAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return "We couldn't sign you in with those details. Please double-check your email and password.";
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('password should be at least')) {
    return 'Please choose a password with at least 6 characters for safety.';
  }
  if (lower.includes('token has expired') || lower.includes('otp expired')) {
    return 'That verification code has expired. Please request a fresh one.';
  }
  if (lower.includes('invalid token') || lower.includes('invalid otp')) {
    return "That code doesn't look right. Please check the digits and try again.";
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please take a gentle breath and try again in a few moments.';
  }
  if (lower.includes('unsupported provider') || lower.includes('not enabled')) {
    return 'This sign-in provider is not enabled yet in your Supabase project dashboard. Go to Authentication → Providers in your Supabase Dashboard to enable it.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return "We're having trouble connecting right now. Please check your internet connection and try again.";
  }
  return msg || 'Unable to complete sign in. Please try again.';
}
