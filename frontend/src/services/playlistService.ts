import { supabase, isPlaceholder } from './supabase';
import { getSignedUrl, deleteAudioFile } from './storage';
import type { PlaylistSong } from '@/types';

export interface CreateSongInput {
  coupleId: string;
  addedById: string;
  title: string;
  artist: string;
  linkUrl?: string;
  storagePath?: string;
  note?: string;
}

export interface UpdateSongInput {
  title: string;
  artist: string;
  linkUrl?: string;
  storagePath?: string;
  note?: string;
}

function getLocalSongs(coupleId: string): PlaylistSong[] {
  try {
    const raw = localStorage.getItem(`ourworld_playlist_${coupleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSongs(coupleId: string, list: PlaylistSong[]) {
  try {
    localStorage.setItem(`ourworld_playlist_${coupleId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('[PlaylistService] LocalStorage save note:', e);
  }
}

export async function fetchPlaylistSongs(coupleId: string): Promise<PlaylistSong[]> {
  if (isPlaceholder || !coupleId) {
    return getLocalSongs(coupleId);
  }

  const localSongs = getLocalSongs(coupleId);

  try {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[PlaylistService] Remote fetch notice, using local cache:', error.message);
      return localSongs;
    }

    if (!data || data.length === 0) {
      return localSongs;
    }

    const rawSongs = data as PlaylistSong[];
    const songsWithUrls: PlaylistSong[] = await Promise.all(
      rawSongs.map(async (song) => {
        let audioUrl: string | undefined = undefined;
        if (song.storage_path) {
          const signed = await getSignedUrl('playlist-audio', song.storage_path, 7200);
          audioUrl = signed || (song.storage_path.startsWith('data:') ? song.storage_path : undefined);
        } else if (song.link_url && (song.link_url.endsWith('.mp3') || song.link_url.endsWith('.wav') || song.link_url.endsWith('.m4a') || song.link_url.endsWith('.ogg'))) {
          audioUrl = song.link_url;
        }

        return {
          ...song,
          audio_url: audioUrl,
        };
      })
    );

    const mergedMap = new Map<string, PlaylistSong>();
    localSongs.forEach((s) => mergedMap.set(s.id, s));
    songsWithUrls.forEach((s) => mergedMap.set(s.id, s));

    const combined = Array.from(mergedMap.values());
    saveLocalSongs(coupleId, combined);
    return combined;
  } catch (err) {
    console.warn('[PlaylistService] Fetch exception, returning local cache:', err);
    return localSongs;
  }
}

export async function addPlaylistSong(input: CreateSongInput): Promise<PlaylistSong> {
  const { coupleId, addedById, title, artist, linkUrl, storagePath, note } = input;

  const localId = crypto.randomUUID();
  const localNewSong: PlaylistSong = {
    id: localId,
    couple_id: coupleId,
    added_by_id: addedById,
    title,
    artist,
    link_url: linkUrl || null,
    storage_path: storagePath || null,
    audio_url: storagePath?.startsWith('data:') ? storagePath : (linkUrl || undefined),
    note: note || null,
    created_at: new Date().toISOString(),
  };

  if (isPlaceholder || !coupleId) {
    const existing = getLocalSongs(coupleId);
    saveLocalSongs(coupleId, [localNewSong, ...existing]);
    return localNewSong;
  }

  try {
    const { data, error } = await supabase
      .from('playlist_songs')
      .insert({
        id: localId,
        couple_id: coupleId,
        added_by_id: addedById,
        title,
        artist,
        link_url: linkUrl || null,
        storage_path: storagePath || null,
        note: note || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('[PlaylistService] Remote insert notice, persisting locally:', error?.message);
      const existing = getLocalSongs(coupleId);
      saveLocalSongs(coupleId, [localNewSong, ...existing]);
      return localNewSong;
    }

    const createdRecord: PlaylistSong = {
      ...(data as PlaylistSong),
      audio_url: storagePath?.startsWith('data:') ? storagePath : undefined,
    };

    const existing = getLocalSongs(coupleId);
    saveLocalSongs(coupleId, [createdRecord, ...existing.filter((s) => s.id !== localId)]);
    return createdRecord;
  } catch (err) {
    console.warn('[PlaylistService] addPlaylistSong exception, persisting locally:', err);
    const existing = getLocalSongs(coupleId);
    saveLocalSongs(coupleId, [localNewSong, ...existing]);
    return localNewSong;
  }
}

export async function updatePlaylistSong(
  songId: string,
  input: UpdateSongInput,
  coupleId?: string
): Promise<PlaylistSong> {
  const { title, artist, linkUrl, storagePath, note } = input;

  const targetCoupleId = coupleId || 'default-couple';
  const existing = getLocalSongs(targetCoupleId);
  const updatedLocal: PlaylistSong = {
    id: songId,
    couple_id: targetCoupleId,
    added_by_id: 'user',
    title,
    artist,
    link_url: linkUrl || null,
    storage_path: storagePath || null,
    audio_url: storagePath?.startsWith('data:') ? storagePath : (linkUrl || undefined),
    note: note || null,
    created_at: new Date().toISOString(),
  };

  saveLocalSongs(
    targetCoupleId,
    existing.map((s) => (s.id === songId ? { ...s, ...updatedLocal } : s))
  );

  if (isPlaceholder || !coupleId) {
    return updatedLocal;
  }

  try {
    await supabase
      .from('playlist_songs')
      .update({
        title,
        artist,
        link_url: linkUrl || null,
        storage_path: storagePath || null,
        note: note || null,
      })
      .eq('id', songId);

    return updatedLocal;
  } catch (err) {
    console.warn('[PlaylistService] updatePlaylistSong notice:', err);
    return updatedLocal;
  }
}

export async function deletePlaylistSong(
  songId: string,
  storagePath?: string | null,
  _coupleId?: string
): Promise<boolean> {
  if (storagePath) {
    void deleteAudioFile(storagePath);
  }

  // Remove from all local sanctuary storage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ourworld_playlist_')) {
      try {
        const list: PlaylistSong[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((s) => s.id !== songId);
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch {}
    }
  }

  if (isPlaceholder) {
    return true;
  }

  try {
    const { error } = await supabase.from('playlist_songs').delete().eq('id', songId);
    if (error) {
      console.warn('[PlaylistService] Remote delete notice:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('[PlaylistService] deletePlaylistSong exception:', err);
    return true;
  }
}

export function subscribeToPlaylist(coupleId: string, onUpdate: () => void) {
  if (isPlaceholder || !coupleId) return null;

  return supabase
    .channel(`couple-playlist-${coupleId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'playlist_songs', filter: `couple_id=eq.${coupleId}` },
      () => onUpdate()
    )
    .subscribe();
}
