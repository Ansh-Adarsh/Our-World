-- =============================================================================
-- Migration 005: Onboarding Journey State
-- Our World — Private Universe for Two
--
-- Adds server-authoritative, per-user onboarding journey state so a brand-new
-- user walks the guided romantic journey exactly once:
--
--   not_started        -> the question game (/onboarding)
--   questions_completed-> the birthday surprise (/journey/birthday)
--   birthday_completed -> the memories introduction (/journey/memories)
--   memories_completed -> the memories timeline  (/journey/memories, stage 2)
--   completed          -> the dashboard (/home)
--
-- The state lives on `profiles` (per user, not per couple) because the journey
-- is a personal first-entry experience: when the second partner joins later,
-- they get their own walk through it.
--
-- EXISTING-USER SAFETY: every profile that exists when this migration is first
-- applied is backfilled to 'completed'. Nobody who is already using the app is
-- ever pushed back into onboarding. The backfill is guarded so that re-running
-- this file cannot fast-forward a user who is mid-journey.
--
-- Append-only: do not edit 001-004. Run this in the Supabase SQL Editor.
-- =============================================================================

-- ─── 1. PROFILE JOURNEY COLUMNS ──────────────────────────────────────────────
DO $$
DECLARE
  column_already_existed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'onboarding_status'
  ) INTO column_already_existed;

  IF NOT column_already_existed THEN
    ALTER TABLE public.profiles
      ADD COLUMN onboarding_status TEXT NOT NULL DEFAULT 'not_started',
      ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

    -- Backfill: anyone who already had an account is a returning user.
    -- Runs ONCE, only in the same block that created the column.
    UPDATE public.profiles
    SET onboarding_status       = 'completed',
        onboarding_completed_at = NOW();

    RAISE NOTICE 'Journey columns added; % existing profile(s) backfilled to completed.',
      (SELECT COUNT(*) FROM public.profiles);
  ELSE
    -- Idempotent re-run: make sure the companion columns exist, touch no data.
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

    RAISE NOTICE 'Journey columns already present; no rows touched.';
  END IF;
END $$;

-- ─── 2. CONSTRAIN THE STATE MACHINE ──────────────────────────────────────────
-- The column is client-writable (see policy note below), so the DB still
-- refuses to store a value that is not part of the state machine.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_onboarding_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_onboarding_status_check
  CHECK (onboarding_status IN (
    'not_started',
    'questions_completed',
    'birthday_completed',
    'memories_completed',
    'completed'
  ));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_onboarding_step_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_onboarding_step_check
  CHECK (onboarding_step >= 0 AND onboarding_step <= 64);

-- ─── 3. NEW SIGNUPS START AT THE BEGINNING ───────────────────────────────────
-- Extends the 001 trigger. New rows rely on the column defaults
-- ('not_started', step 0) — stated explicitly here so the intent is readable.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, onboarding_status, onboarding_step)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'not_started',
    0
  );
  RETURN NEW;
END;
$$;

-- ─── 4. RLS ──────────────────────────────────────────────────────────────────
-- No new policies needed. 001 already grants a user SELECT + UPDATE on their
-- own profile row (auth.uid() = id), which is exactly the access the journey
-- needs, and nothing wider.
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.profiles.onboarding_status IS
  'Journey state machine. Server-authoritative (read on every app load) and '
  'writable by the owning user only, via the profiles_update_own policy. '
  'This gates a personal experience, not private data — couple isolation is '
  'still enforced by couple_id RLS on every feature table.';

COMMENT ON COLUMN public.profiles.onboarding_step IS
  'Resume point inside the onboarding question game (0-based question index).';

-- ─── 5. VERIFY ───────────────────────────────────────────────────────────────
-- Expected: every pre-existing user is 'completed'; only genuinely new signups
-- appear as 'not_started'.
--
--   SELECT onboarding_status, COUNT(*)
--   FROM public.profiles
--   GROUP BY onboarding_status;
--
-- To replay the journey for yourself while testing:
--
--   UPDATE public.profiles
--   SET onboarding_status = 'not_started',
--       onboarding_step = 0,
--       onboarding_completed_at = NULL
--   WHERE id = auth.uid();

COMMENT ON SCHEMA public IS
  'Our World schema — Phase 6: guided onboarding journey (RLS hardened) ❤️';
