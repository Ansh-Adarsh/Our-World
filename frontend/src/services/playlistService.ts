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

export async function fetchPlaylistSongs(coupleId: string): Promise<PlaylistSong[]> {
  if (isPlaceholder) {
    return getDemoSongs(coupleId);
  }
  try {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PlaylistService] Fetch songs error:', error.message);
      throw new Error(error.message);
    }

    if (!data) return [];

    const rawSongs = data as PlaylistSong[];
    const songsWithUrls: PlaylistSong[] = await Promise.all(
      rawSongs.map(async (song) => {
        let audioUrl: string | undefined = undefined;
        if (song.storage_path) {
          const signed = await getSignedUrl('playlist-audio', song.storage_path, 7200);
          audioUrl = signed || undefined;
        } else if (song.link_url && (song.link_url.endsWith('.mp3') || song.link_url.endsWith('.wav') || song.link_url.endsWith('.m4a') || song.link_url.endsWith('.ogg'))) {
          audioUrl = song.link_url;
        }

        return {
          ...song,
          audio_url: audioUrl,
        };
      })
    );

    return songsWithUrls;
  } catch (err) {
    console.error('[PlaylistService] Exception in fetchPlaylistSongs:', err);
    throw err;
  }
}

export async function addPlaylistSong(input: CreateSongInput): Promise<PlaylistSong> {
  const { coupleId, addedById, title, artist, linkUrl, storagePath, note } = input;

  if (isPlaceholder) {
    return {
      id: crypto.randomUUID(),
      couple_id: coupleId,
      added_by_id: addedById,
      title,
      artist,
      link_url: linkUrl || null,
      storage_path: storagePath || null,
      audio_url: storagePath?.startsWith('data:') ? storagePath : undefined,
      note: note || null,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('playlist_songs')
    .insert({
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
    console.error('[PlaylistService] Insert song failed:', error?.message);
    throw new Error(error?.message || 'Failed to add song to playlist');
  }

  let audioUrl: string | undefined = undefined;
  if (storagePath) {
    const signed = await getSignedUrl('playlist-audio', storagePath, 7200);
    audioUrl = signed || undefined;
  }

  return {
    ...(data as PlaylistSong),
    audio_url: audioUrl,
  };
}

export async function updatePlaylistSong(
  songId: string,
  input: UpdateSongInput,
  coupleId: string
): Promise<PlaylistSong> {
  const { title, artist, linkUrl, storagePath, note } = input;

  if (isPlaceholder) {
    return {
      id: songId,
      couple_id: coupleId,
      added_by_id: 'mock-user',
      title,
      artist,
      link_url: linkUrl || null,
      storage_path: storagePath || null,
      audio_url: undefined,
      note: note || null,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('playlist_songs')
    .update({
      title,
      artist,
      link_url: linkUrl || null,
      storage_path: storagePath || null,
      note: note || null,
    })
    .eq('id', songId)
    .select()
    .single();

  if (error || !data) {
    console.error('[PlaylistService] Update song failed:', error?.message);
    throw new Error(error?.message || 'Failed to update song');
  }

  let audioUrl: string | undefined = undefined;
  if (storagePath) {
    const signed = await getSignedUrl('playlist-audio', storagePath, 7200);
    audioUrl = signed || undefined;
  }

  return {
    ...(data as PlaylistSong),
    audio_url: audioUrl,
  };
}

export async function deletePlaylistSong(
  songId: string,
  storagePath?: string | null
): Promise<boolean> {
  if (isPlaceholder) return true;

  // 1. Delete associated audio file from storage
  if (storagePath) {
    await deleteAudioFile(storagePath);
  }

  // 2. Delete database record
  const { error } = await supabase.from('playlist_songs').delete().eq('id', songId);
  if (error) {
    console.error('[PlaylistService] Delete song DB error:', error.message);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Realtime subscription to playlist table changes
 */
export function subscribeToPlaylist(
  coupleId: string,
  onChange: () => void
) {
  return supabase
    .channel(`couple-playlist-${coupleId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'playlist_songs',
        filter: `couple_id=eq.${coupleId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();
}

function getDemoSongs(coupleId: string): PlaylistSong[] {
  return [
    {
      id: 'demo-song-1',
      couple_id: coupleId,
      added_by_id: 'demo-user',
      title: 'Lover',
      artist: 'Taylor Swift',
      link_url: 'https://open.spotify.com/track/1dGr1c8CrMLDpV6mviImPD',
      note: 'Our official theme song from our first road trip!',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-song-2',
      couple_id: coupleId,
      added_by_id: 'demo-user',
      title: 'Perfect',
      artist: 'Ed Sheeran',
      link_url: 'https://open.spotify.com/track/08mG3YxsBDj2EGrjBBmZ1s',
      note: 'Dancing together in the living room',
      created_at: new Date().toISOString(),
    },
  ];
}
