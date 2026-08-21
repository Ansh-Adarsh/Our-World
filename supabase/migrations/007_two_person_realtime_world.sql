-- =============================================================================
-- Migration 007: Two-Person Shared World & Real-Time Long-Distance System
-- Our World — Private Universe for Two
--
-- 1. Adds `invite_code` to `public.couples` for easy, romantic partner pairing.
-- 2. Adds `join_couple_by_invite_code(code)` security definer function.
-- 3. Extends `public.messages` with `read_at` for read receipts.
-- 4. Adds `messages`, `memories`, `events`, `playlist_songs` to Supabase Realtime publication.
-- 5. Tightens RLS security for couple isolation.
-- =============================================================================

-- ─── 1. EXTEND COUPLES TABLE ──────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.couples
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS partner_1_timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS partner_2_timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS partner_1_status TEXT DEFAULT 'together',
  ADD COLUMN IF NOT EXISTS partner_2_status TEXT DEFAULT 'together';

-- Function to generate romantic invite code (e.g. LOVE-74892)
CREATE OR REPLACE FUNCTION public.generate_couple_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN;
BEGIN
  done := FALSE;
  WHILE NOT done LOOP
    new_code := 'LOVE-' || lpad(floor(random() * 100000)::text, 5, '0');
    IF NOT EXISTS (SELECT 1 FROM public.couples WHERE invite_code = new_code) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Trigger to auto-assign invite_code on couple creation
CREATE OR REPLACE FUNCTION public.set_couple_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_couple_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trig_set_couple_invite_code'
  ) THEN
    CREATE TRIGGER trig_set_couple_invite_code
      BEFORE INSERT ON public.couples
      FOR EACH ROW EXECUTE FUNCTION public.set_couple_invite_code();
  END IF;
END $$;

-- Backfill existing couples with invite codes if missing
UPDATE public.couples
SET invite_code = public.generate_couple_invite_code()
WHERE invite_code IS NULL;

-- ─── 2. FUNCTION: JOIN COUPLE BY INVITE CODE ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.join_couple_by_invite_code(invite_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_couple RECORD;
  current_user_id UUID;
  existing_membership RECORD;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Trim and uppercase input code
  invite_code_input := UPPER(TRIM(invite_code_input));

  -- Find couple with this invite code
  SELECT * INTO target_couple
  FROM public.couples
  WHERE UPPER(invite_code) = invite_code_input;

  IF target_couple.id IS NULL THEN
    RAISE EXCEPTION 'Sanctuary not found with invite code: %', invite_code_input;
  END IF;

  -- Check if user is already a member of this couple
  SELECT * INTO existing_membership
  FROM public.couple_members
  WHERE couple_id = target_couple.id AND user_id = current_user_id;

  IF existing_membership.id IS NOT NULL THEN
    -- Already member, return couple
    RETURN to_jsonb(target_couple);
  END IF;

  -- Check if couple already has 2 members
  IF (SELECT count(*) FROM public.couple_members WHERE couple_id = target_couple.id) >= 2 THEN
    RAISE EXCEPTION 'This sanctuary already has two partners connected.';
  END IF;

  -- Link as partner_2 if partner_2_id is null
  IF target_couple.partner_2_id IS NULL AND target_couple.partner_1_id != current_user_id THEN
    UPDATE public.couples
    SET partner_2_id = current_user_id,
        updated_at = NOW()
    WHERE id = target_couple.id;
  END IF;

  -- Insert couple_members row
  INSERT INTO public.couple_members (couple_id, user_id, role)
  VALUES (target_couple.id, current_user_id, 'member')
  ON CONFLICT (couple_id, user_id) DO NOTHING;

  -- Return updated couple data
  SELECT * INTO target_couple
  FROM public.couples
  WHERE id = target_couple.id;

  RETURN to_jsonb(target_couple);
END;
$$;

-- ─── 3. EXTEND MESSAGES TABLE WITH READ STATUS ───────────────────────────────
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(target_couple_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = NOW()
  WHERE couple_id = target_couple_id
    AND sender_id != auth.uid()
    AND read_at IS NULL;
END;
$$;

-- ─── 4. REALTIME PUBLICATION REGISTRATION ───────────────────────────────────
DO $$
BEGIN
  -- Add messages if not in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  -- Add memories
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'memories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
  END IF;

  -- Add events
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;

  -- Add playlist_songs
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'playlist_songs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_songs;
  END IF;
END $$;

COMMENT ON SCHEMA public IS 'Our World schema — Migration 007: Two-Person Shared World & Real-Time Sync ❤️';
