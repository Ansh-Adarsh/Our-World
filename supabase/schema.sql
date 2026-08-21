-- =============================================================================
-- OUR WORLD ❤️ — COMPLETE MASTER DATABASE SCHEMA & SETUP
-- Run this entire script in your Supabase Project SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. PROFILES TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            TEXT,
  avatar_url              TEXT,
  onboarding_status       TEXT        NOT NULL DEFAULT 'not_started',
  onboarding_step         INTEGER     NOT NULL DEFAULT 0,
  onboarding_completed_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── 2. COUPLES TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.couples (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_name          TEXT,
  anniversary_date     DATE,
  partner_name         TEXT,
  partner_birthday     DATE,
  onboarding_completed BOOLEAN     DEFAULT FALSE,
  partner_1_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_2_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_code          TEXT        UNIQUE,
  partner_1_timezone   TEXT        DEFAULT 'UTC',
  partner_2_timezone   TEXT        DEFAULT 'UTC',
  partner_1_status     TEXT        DEFAULT 'together',
  partner_2_status     TEXT        DEFAULT 'together',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- ─── 3. COUPLE MEMBERS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.couple_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (couple_id, user_id)
);

ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couple_members_select" ON public.couple_members;
CREATE POLICY "couple_members_select"
  ON public.couple_members FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "couples_select_member" ON public.couples;
CREATE POLICY "couples_select_member"
  ON public.couples FOR SELECT
  USING (
    id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "couples_update_member" ON public.couples;
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

-- ─── 4. ONBOARDING ANSWERS TABLE ─────────────────────────────────────────────
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

DROP POLICY IF EXISTS "onboarding_answers_select" ON public.onboarding_answers;
CREATE POLICY "onboarding_answers_select"
  ON public.onboarding_answers FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "onboarding_answers_insert" ON public.onboarding_answers;
CREATE POLICY "onboarding_answers_insert"
  ON public.onboarding_answers FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "onboarding_answers_update" ON public.onboarding_answers;
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

-- ─── 5. MEMORIES & PHOTOS TABLES ─────────────────────────────────────────────
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

DROP POLICY IF EXISTS "memories_select" ON public.memories;
CREATE POLICY "memories_select"
  ON public.memories FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memories_insert" ON public.memories;
CREATE POLICY "memories_insert"
  ON public.memories FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memories_update" ON public.memories;
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

DROP POLICY IF EXISTS "memories_delete" ON public.memories;
CREATE POLICY "memories_delete"
  ON public.memories FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.memory_photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id    UUID        NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  caption      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memory_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_photos_select" ON public.memory_photos;
CREATE POLICY "memory_photos_select"
  ON public.memory_photos FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memory_photos_insert" ON public.memory_photos;
CREATE POLICY "memory_photos_insert"
  ON public.memory_photos FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memory_photos_delete" ON public.memory_photos;
CREATE POLICY "memory_photos_delete"
  ON public.memory_photos FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── 6. DIARY ENTRIES TABLE ──────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "diary_entries_select" ON public.diary_entries;
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

DROP POLICY IF EXISTS "diary_entries_insert" ON public.diary_entries;
CREATE POLICY "diary_entries_insert"
  ON public.diary_entries FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "diary_entries_update" ON public.diary_entries;
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

DROP POLICY IF EXISTS "diary_entries_delete" ON public.diary_entries;
CREATE POLICY "diary_entries_delete"
  ON public.diary_entries FOR DELETE
  USING (author_id = auth.uid());

-- ─── 7. EVENTS TABLE ─────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "events_update" ON public.events;
CREATE POLICY "events_update"
  ON public.events FOR UPDATE
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

DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_delete"
  ON public.events FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── 8. MESSAGES TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  message_type TEXT        NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'heart', 'photo', 'voice_note')),
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── 9. PLAYLIST SONGS TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  added_by_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  artist       TEXT        NOT NULL,
  link_url     TEXT,
  storage_path TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "playlist_songs_select" ON public.playlist_songs;
CREATE POLICY "playlist_songs_select"
  ON public.playlist_songs FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "playlist_songs_insert" ON public.playlist_songs;
CREATE POLICY "playlist_songs_insert"
  ON public.playlist_songs FOR INSERT
  WITH CHECK (
    added_by_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "playlist_songs_update" ON public.playlist_songs;
CREATE POLICY "playlist_songs_update"
  ON public.playlist_songs FOR UPDATE
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

DROP POLICY IF EXISTS "playlist_songs_delete" ON public.playlist_songs;
CREATE POLICY "playlist_songs_delete"
  ON public.playlist_songs FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── 10. GIFTS TABLE ─────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "gifts_select" ON public.gifts;
CREATE POLICY "gifts_select"
  ON public.gifts FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "gifts_insert" ON public.gifts;
CREATE POLICY "gifts_insert"
  ON public.gifts FOR INSERT
  WITH CHECK (
    added_by_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "gifts_update" ON public.gifts;
CREATE POLICY "gifts_update"
  ON public.gifts FOR UPDATE
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

DROP POLICY IF EXISTS "gifts_delete" ON public.gifts;
CREATE POLICY "gifts_delete"
  ON public.gifts FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── 11. QUIZZES TABLES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  creator_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select" ON public.quizzes;
CREATE POLICY "quizzes_select"
  ON public.quizzes FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "quizzes_insert" ON public.quizzes;
CREATE POLICY "quizzes_insert"
  ON public.quizzes FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "quizzes_delete" ON public.quizzes;
CREATE POLICY "quizzes_delete"
  ON public.quizzes FOR DELETE
  USING (
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

DROP POLICY IF EXISTS "quiz_questions_select" ON public.quiz_questions;
CREATE POLICY "quiz_questions_select"
  ON public.quiz_questions FOR SELECT
  USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "quiz_questions_insert" ON public.quiz_questions;
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

DROP POLICY IF EXISTS "quiz_answers_select" ON public.quiz_answers;
CREATE POLICY "quiz_answers_select"
  ON public.quiz_answers FOR SELECT
  USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "quiz_answers_insert" ON public.quiz_answers;
CREATE POLICY "quiz_answers_insert"
  ON public.quiz_answers FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- ─── 12. UNDERSTANDING CORNER TABLE ──────────────────────────────────────────
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

DROP POLICY IF EXISTS "understanding_entries_select" ON public.understanding_entries;
CREATE POLICY "understanding_entries_select"
  ON public.understanding_entries FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "understanding_entries_insert" ON public.understanding_entries;
CREATE POLICY "understanding_entries_insert"
  ON public.understanding_entries FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "understanding_entries_update" ON public.understanding_entries;
CREATE POLICY "understanding_entries_update"
  ON public.understanding_entries FOR UPDATE
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

DROP POLICY IF EXISTS "understanding_entries_delete" ON public.understanding_entries;
CREATE POLICY "understanding_entries_delete"
  ON public.understanding_entries FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

-- ─── 13. SURPRISES & SURPRISE QUESTIONS TABLES ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.surprises (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id        UUID        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  creator_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occasion         TEXT        NOT NULL DEFAULT 'birthday' CHECK (occasion IN ('birthday', 'anniversary', 'first_meeting', 'proposal', 'valentine', 'achievement', 'apology', 'just_because', 'custom')),
  title            TEXT        NOT NULL,
  letter_message   TEXT,
  cover_photo_url  TEXT,
  music_url        TEXT,
  status           TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_viewed        BOOLEAN     NOT NULL DEFAULT FALSE,
  viewed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.surprises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surprises_select" ON public.surprises;
CREATE POLICY "surprises_select"
  ON public.surprises FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
    AND (
      creator_id = auth.uid()
      OR (recipient_id = auth.uid() AND status = 'published')
    )
  );

DROP POLICY IF EXISTS "surprises_insert" ON public.surprises;
CREATE POLICY "surprises_insert"
  ON public.surprises FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "surprises_update" ON public.surprises;
CREATE POLICY "surprises_update"
  ON public.surprises FOR UPDATE
  USING (
    creator_id = auth.uid()
    OR (recipient_id = auth.uid() AND status = 'published')
  )
  WITH CHECK (
    creator_id = auth.uid()
    OR (recipient_id = auth.uid() AND status = 'published')
  );

DROP POLICY IF EXISTS "surprises_delete" ON public.surprises;
CREATE POLICY "surprises_delete"
  ON public.surprises FOR DELETE
  USING (creator_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.surprise_questions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  surprise_id         UUID        NOT NULL REFERENCES public.surprises(id) ON DELETE CASCADE,
  question_order      INT         NOT NULL DEFAULT 1,
  question_type       TEXT        NOT NULL DEFAULT 'playful_choice',
  question_text       TEXT        NOT NULL,
  yes_text            TEXT        NOT NULL DEFAULT 'Yes ❤️',
  no_text             TEXT        NOT NULL DEFAULT 'No 😂',
  no_button_behavior  TEXT        NOT NULL DEFAULT 'escape' CHECK (no_button_behavior IN ('escape', 'grow_yes', 'shake', 'toast')),
  hint                TEXT,
  reveal_message      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.surprise_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surprise_questions_select" ON public.surprise_questions;
CREATE POLICY "surprise_questions_select"
  ON public.surprise_questions FOR SELECT
  USING (
    surprise_id IN (
      SELECT id FROM public.surprises
      WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
      AND (creator_id = auth.uid() OR (recipient_id = auth.uid() AND status = 'published'))
    )
  );

DROP POLICY IF EXISTS "surprise_questions_insert" ON public.surprise_questions;
CREATE POLICY "surprise_questions_insert"
  ON public.surprise_questions FOR INSERT
  WITH CHECK (
    surprise_id IN (
      SELECT id FROM public.surprises WHERE creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "surprise_questions_update" ON public.surprise_questions;
CREATE POLICY "surprise_questions_update"
  ON public.surprise_questions FOR UPDATE
  USING (
    surprise_id IN (
      SELECT id FROM public.surprises WHERE creator_id = auth.uid()
    )
  )
  WITH CHECK (
    surprise_id IN (
      SELECT id FROM public.surprises WHERE creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "surprise_questions_delete" ON public.surprise_questions;
CREATE POLICY "surprise_questions_delete"
  ON public.surprise_questions FOR DELETE
  USING (
    surprise_id IN (
      SELECT id FROM public.surprises WHERE creator_id = auth.uid()
    )
  );

-- ─── 14. TRIGGERS & PROCEDURES ───────────────────────────────────────────────

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS couples_updated_at ON public.couples;
CREATE TRIGGER couples_updated_at BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS memories_updated_at ON public.memories;
CREATE TRIGGER memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS diary_entries_updated_at ON public.diary_entries;
CREATE TRIGGER diary_entries_updated_at BEFORE UPDATE ON public.diary_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS playlist_songs_updated_at ON public.playlist_songs;
CREATE TRIGGER playlist_songs_updated_at BEFORE UPDATE ON public.playlist_songs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS understanding_entries_updated_at ON public.understanding_entries;
CREATE TRIGGER understanding_entries_updated_at BEFORE UPDATE ON public.understanding_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION public.generate_couple_invite_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_code := 'LOVE-' || lpad(floor(random() * 100000)::text, 5, '0');
    IF NOT EXISTS (SELECT 1 FROM public.couples WHERE invite_code = new_code) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Trigger to auto-assign invite_code
CREATE OR REPLACE FUNCTION public.set_couple_invite_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_couple_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trig_set_couple_invite_code ON public.couples;
CREATE TRIGGER trig_set_couple_invite_code
  BEFORE INSERT ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.set_couple_invite_code();

-- Auto create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, onboarding_status, onboarding_step)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'not_started',
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 14. SECURITY DEFINER RPC FUNCTIONS ──────────────────────────────────────

-- RPC: Create couple directly from client (bypasses service-role requirement)
CREATE OR REPLACE FUNCTION public.create_couple_for_user(
  couple_name_input TEXT DEFAULT NULL,
  anniversary_date_input DATE DEFAULT NULL,
  partner_name_input TEXT DEFAULT NULL,
  partner_birthday_input DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
  existing_member RECORD;
  new_couple RECORD;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- If user already belongs to a couple, return it
  SELECT c.* INTO new_couple
  FROM public.couple_members cm
  JOIN public.couples c ON c.id = cm.couple_id
  WHERE cm.user_id = current_user_id
  LIMIT 1;

  IF new_couple.id IS NOT NULL THEN
    -- Update fields if provided
    UPDATE public.couples
    SET
      couple_name = COALESCE(couple_name_input, couple_name),
      anniversary_date = COALESCE(anniversary_date_input, anniversary_date),
      partner_name = COALESCE(partner_name_input, partner_name),
      partner_birthday = COALESCE(partner_birthday_input, partner_birthday),
      updated_at = NOW()
    WHERE id = new_couple.id;

    SELECT * INTO new_couple FROM public.couples WHERE id = new_couple.id;
    RETURN to_jsonb(new_couple);
  END IF;

  -- Create new couple
  INSERT INTO public.couples (
    couple_name,
    anniversary_date,
    partner_name,
    partner_birthday,
    partner_1_id,
    invite_code
  )
  VALUES (
    COALESCE(couple_name_input, 'Our Shared Sanctuary'),
    anniversary_date_input,
    partner_name_input,
    partner_birthday_input,
    current_user_id,
    public.generate_couple_invite_code()
  )
  RETURNING * INTO new_couple;

  -- Add user as admin member
  INSERT INTO public.couple_members (couple_id, user_id, role)
  VALUES (new_couple.id, current_user_id, 'admin')
  ON CONFLICT (couple_id, user_id) DO NOTHING;

  RETURN to_jsonb(new_couple);
END;
$$;

-- RPC: Join couple by invite code
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

  invite_code_input := UPPER(TRIM(invite_code_input));

  SELECT * INTO target_couple
  FROM public.couples
  WHERE UPPER(invite_code) = invite_code_input;

  IF target_couple.id IS NULL THEN
    RAISE EXCEPTION 'Sanctuary not found with invite code: %', invite_code_input;
  END IF;

  SELECT * INTO existing_membership
  FROM public.couple_members
  WHERE couple_id = target_couple.id AND user_id = current_user_id;

  IF existing_membership.id IS NOT NULL THEN
    RETURN to_jsonb(target_couple);
  END IF;

  IF (SELECT count(*) FROM public.couple_members WHERE couple_id = target_couple.id) >= 2 THEN
    RAISE EXCEPTION 'This sanctuary already has two partners connected.';
  END IF;

  IF target_couple.partner_2_id IS NULL AND target_couple.partner_1_id != current_user_id THEN
    UPDATE public.couples
    SET partner_2_id = current_user_id,
        updated_at = NOW()
    WHERE id = target_couple.id;
  END IF;

  INSERT INTO public.couple_members (couple_id, user_id, role)
  VALUES (target_couple.id, current_user_id, 'member')
  ON CONFLICT (couple_id, user_id) DO NOTHING;

  SELECT * INTO target_couple
  FROM public.couples
  WHERE id = target_couple.id;

  RETURN to_jsonb(target_couple);
END;
$$;

-- RPC: Mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(target_couple_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = NOW()
  WHERE couple_id = target_couple_id
    AND sender_id != auth.uid()
    AND read_at IS NULL;
END;
$$;

-- ─── 15. STORAGE BUCKETS & POLICIES ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories-photos', 'memories-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('playlist-audio', 'playlist-audio', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$
BEGIN
  -- memories-photos policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_memories_photos_select') THEN
    CREATE POLICY "storage_memories_photos_select" ON storage.objects FOR SELECT
      USING (bucket_id = 'memories-photos' AND (storage.foldername(name))[1]::uuid IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_memories_photos_insert') THEN
    CREATE POLICY "storage_memories_photos_insert" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'memories-photos' AND (storage.foldername(name))[1]::uuid IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_memories_photos_delete') THEN
    CREATE POLICY "storage_memories_photos_delete" ON storage.objects FOR DELETE
      USING (bucket_id = 'memories-photos' AND (storage.foldername(name))[1]::uuid IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;

  -- playlist-audio policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_playlist_audio_select') THEN
    CREATE POLICY "storage_playlist_audio_select" ON storage.objects FOR SELECT
      USING (bucket_id = 'playlist-audio' AND (storage.foldername(name))[1]::uuid IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_playlist_audio_insert') THEN
    CREATE POLICY "storage_playlist_audio_insert" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'playlist-audio' AND (storage.foldername(name))[1]::uuid IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_playlist_audio_delete') THEN
    CREATE POLICY "storage_playlist_audio_delete" ON storage.objects FOR DELETE
      USING (bucket_id = 'playlist-audio' AND (storage.foldername(name))[1]::uuid IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── 16. REALTIME REPLICATION ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'memories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'playlist_songs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_songs;
  END IF;
END $$;
