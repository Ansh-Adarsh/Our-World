-- ============================================================================
-- Migration: 003_phase3_schema.sql
-- Description: Schema additions for Phase 3 — events, messages, playlist, gifts, quizzes, understanding corner
-- Security: RLS enabled on every table. Deny by default. Strictly enforced couple isolation.
-- ============================================================================

-- ─── EVENTS TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  event_date   DATE        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'anniversary' CHECK (category IN ('anniversary', 'date_night', 'trip', 'milestone', 'other')),
  is_annual    BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_update"
  ON public.events FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_delete"
  ON public.events FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── MESSAGES TABLE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  message_type TEXT        NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'heart', 'photo', 'voice_note')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- Enable Supabase Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ─── PLAYLIST SONGS TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  added_by_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  artist       TEXT        NOT NULL,
  link_url     TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlist_songs_select"
  ON public.playlist_songs FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "playlist_songs_insert"
  ON public.playlist_songs FOR INSERT
  WITH CHECK (
    added_by_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "playlist_songs_delete"
  ON public.playlist_songs FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── GIFTS TABLE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gifts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id      UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  added_by_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  description    TEXT,
  price_estimate TEXT,
  link_url       TEXT,
  is_given       BOOLEAN     NOT NULL DEFAULT FALSE,
  given_at       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gifts_select"
  ON public.gifts FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "gifts_insert"
  ON public.gifts FOR INSERT
  WITH CHECK (
    added_by_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "gifts_update"
  ON public.gifts FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "gifts_delete"
  ON public.gifts FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── QUIZZES & ANSWERS TABLES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  creator_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_select"
  ON public.quizzes FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "quizzes_insert"
  ON public.quizzes FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id              UUID    NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text        TEXT    NOT NULL,
  options              TEXT[]  NOT NULL,
  correct_option_index INT     NOT NULL DEFAULT 0
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_questions_select"
  ON public.quiz_questions FOR SELECT
  USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "quiz_questions_insert"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE creator_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID        NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id     UUID        NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_option INT         NOT NULL,
  is_correct      BOOLEAN     NOT NULL,
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_answers_select"
  ON public.quiz_answers FOR SELECT
  USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "quiz_answers_insert"
  ON public.quiz_answers FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- ─── UNDERSTANDING CORNER TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.understanding_entries (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id                    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id                    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic                        TEXT        NOT NULL,
  my_perspective               TEXT        NOT NULL,
  partner_perspective_summary TEXT,
  proposed_resolution          TEXT,
  status                       TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.understanding_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "understanding_entries_select"
  ON public.understanding_entries FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "understanding_entries_insert"
  ON public.understanding_entries FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "understanding_entries_update"
  ON public.understanding_entries FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER understanding_entries_updated_at
  BEFORE UPDATE ON public.understanding_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
