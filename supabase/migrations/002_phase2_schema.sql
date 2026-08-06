-- ============================================================================
-- Migration: 002_phase2_schema.sql
-- Description: Schema additions for Phase 2 — onboarding, memories, photos, diary
-- Security: RLS enabled on every table. Strict couple isolation and private diary filtering.
-- ============================================================================

-- ─── EXTEND COUPLES TABLE ───────────────────────────────────────────────────
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS partner_birthday DATE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ─── ONBOARDING ANSWERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_answers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key  TEXT        NOT NULL,
  answer_text   TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (couple_id, user_id, question_key)
);

ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;

-- Couple members can read onboarding answers
CREATE POLICY "onboarding_answers_select"
  ON public.onboarding_answers FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert/update their own onboarding answers
CREATE POLICY "onboarding_answers_insert"
  ON public.onboarding_answers FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "onboarding_answers_update"
  ON public.onboarding_answers FOR UPDATE
  USING (
    user_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── MEMORIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memories (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  memory_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  location     TEXT,
  tags         TEXT[]      DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Couple members can read memories
CREATE POLICY "memories_select"
  ON public.memories FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- Couple members can create memories
CREATE POLICY "memories_insert"
  ON public.memories FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- Memory author or couple member can update memory
CREATE POLICY "memories_update"
  ON public.memories FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- Memory author or couple member can delete memory
CREATE POLICY "memories_delete"
  ON public.memories FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── MEMORY PHOTOS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id    UUID        NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  caption      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memory_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_photos_select"
  ON public.memory_photos FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "memory_photos_insert"
  ON public.memory_photos FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "memory_photos_delete"
  ON public.memory_photos FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── DIARY ENTRIES ──────────────────────────────────────────────────────────
-- Note: visibility MUST be 'PRIVATE' or 'SHARED'
-- SECURITY RULE: 'PRIVATE' entries are strictly restricted to author_id = auth.uid() at DB layer.
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  mood        TEXT,
  visibility  TEXT        NOT NULL DEFAULT 'SHARED' CHECK (visibility IN ('PRIVATE', 'SHARED')),
  entry_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- SELECT policy: SHARED entries accessible by couple members; PRIVATE entries ONLY by author
CREATE POLICY "diary_entries_select"
  ON public.diary_entries FOR SELECT
  USING (
    (
      visibility = 'SHARED' AND
      couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
    OR
    (
      visibility = 'PRIVATE' AND
      author_id = auth.uid()
    )
  );

-- INSERT policy: Must be author and member of the couple
CREATE POLICY "diary_entries_insert"
  ON public.diary_entries FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE policy: Author can update their own entries; partner can update SHARED entries if allowed
CREATE POLICY "diary_entries_update"
  ON public.diary_entries FOR UPDATE
  USING (
    author_id = auth.uid() OR
    (
      visibility = 'SHARED' AND
      couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    author_id = auth.uid() OR
    (
      visibility = 'SHARED' AND
      couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
  );

-- DELETE policy: Only author can delete entry
CREATE POLICY "diary_entries_delete"
  ON public.diary_entries FOR DELETE
  USING (author_id = auth.uid());

-- ─── STORAGE BUCKET SETUP & POLICIES ─────────────────────────────────────────
-- Insert private storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories-photos', 'memories-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage object policies: Objects stored under path `{couple_id}/{memory_id}/{filename}`
CREATE POLICY "storage_memories_photos_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memories-photos' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "storage_memories_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memories-photos' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "storage_memories_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memories-photos' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── TRIGGERS FOR UPDATED_AT ────────────────────────────────────────────────
CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER onboarding_answers_updated_at
  BEFORE UPDATE ON public.onboarding_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
