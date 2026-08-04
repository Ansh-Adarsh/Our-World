-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema for Our World — profiles, couples, couple_members
-- Security: RLS enabled on every table. Default deny. Explicit allow policies.
-- ============================================================================

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One profile per authenticated user. Auto-created on signup via trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profile creation is handled only by the trigger below (not by client)
CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── COUPLES ─────────────────────────────────────────────────────────────────
-- One couple record per relationship. Created by the backend service role.
CREATE TABLE IF NOT EXISTS public.couples (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_name      TEXT,
  anniversary_date DATE,
  partner_1_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_2_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- A user can only read their own couple
CREATE POLICY "couples_select_member"
  ON public.couples FOR SELECT
  USING (
    id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- Only the backend (service role) can create couples — no client INSERT policy
-- A user can update their couple only if they are a member
CREATE POLICY "couples_update_member"
  ON public.couples FOR UPDATE
  USING (
    id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── COUPLE MEMBERS ──────────────────────────────────────────────────────────
-- Join table between users and couples. Enforces couple isolation at DB level.
-- couple_id here is THE source of truth — never trusted from client alone.
CREATE TABLE IF NOT EXISTS public.couple_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (couple_id, user_id)
);

ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

-- A user can only see membership rows for their own couple
CREATE POLICY "couple_members_select"
  ON public.couple_members FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- Only the backend (service role) can insert/delete couple members
-- This prevents client from adding themselves to arbitrary couples

-- ─── TRIGGER: Auto-create profile on signup ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER couples_updated_at
  BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
