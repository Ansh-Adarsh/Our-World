-- =============================================================================
-- Migration 006: Audio Upload Storage & Playlist CRUD Enhancements
-- Our World — Private Universe for Two
--
-- 1. Extends playlist_songs table with storage_path for personal audio files.
-- 2. Sets up private storage bucket `playlist-audio` with strict RLS policies.
-- 3. Ensures RLS UPDATE and DELETE policies for playlist_songs, events, and memories.
-- =============================================================================

-- ─── 1. EXTEND PLAYLIST SONGS TABLE ──────────────────────────────────────────
ALTER TABLE IF EXISTS public.playlist_songs
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add UPDATE policy for playlist_songs if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playlist_songs' AND policyname = 'playlist_songs_update'
  ) THEN
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
  END IF;
END $$;

-- ─── 2. SETUP STORAGE BUCKET: playlist-audio ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('playlist-audio', 'playlist-audio', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage object policies: Objects stored under path `{couple_id}/{uuid}-{filename}`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_playlist_audio_select'
  ) THEN
    CREATE POLICY "storage_playlist_audio_select"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'playlist-audio' AND
        (storage.foldername(name))[1]::uuid IN (
          SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_playlist_audio_insert'
  ) THEN
    CREATE POLICY "storage_playlist_audio_insert"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'playlist-audio' AND
        (storage.foldername(name))[1]::uuid IN (
          SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'storage_playlist_audio_delete'
  ) THEN
    CREATE POLICY "storage_playlist_audio_delete"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'playlist-audio' AND
        (storage.foldername(name))[1]::uuid IN (
          SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ─── 3. TRIGGER FOR PLAYLIST_SONGS UPDATED_AT ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'playlist_songs_updated_at'
  ) THEN
    CREATE TRIGGER playlist_songs_updated_at
      BEFORE UPDATE ON public.playlist_songs
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

COMMENT ON SCHEMA public IS 'Our World schema — Migration 006: Audio upload & CRUD enhanced ❤️';
