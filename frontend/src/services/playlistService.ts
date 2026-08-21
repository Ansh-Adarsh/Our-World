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

    if (error || !data) {
      console.warn('[PlaylistService] Fetch note:', error?.message);
      return getDemoSongs(coupleId);
    }

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

    return songsWithUrls.length > 0 ? songsWithUrls : getDemoSongs(coupleId);
  } catch (err) {
    console.error('[PlaylistService] Exception:', err);
    return getDemoSongs(coupleId);
  }
}

export async function addPlaylistSong(input: CreateSongInput): Promise<PlaylistSong | null> {
  const { coupleId, addedById, title, artist, linkUrl, storagePath, note } = input;

  try {
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

    let audioUrl: string | undefined = undefined;
    if (storagePath) {
      const signed = await getSignedUrl('playlist-audio', storagePath, 7200);
      audioUrl = signed || (storagePath.startsWith('data:') ? storagePath : undefined);
    }

    if (error || !data) {
      console.warn('[PlaylistService] Insert note:', error?.message);
      return {
        id: crypto.randomUUID(),
        couple_id: coupleId,
        added_by_id: addedById,
        title,
        artist,
        link_url: linkUrl || null,
        storage_path: storagePath || null,
        audio_url: audioUrl,
        note: note || null,
        created_at: new Date().toISOString(),
      };
    }

    return {
      ...(data as PlaylistSong),
      audio_url: audioUrl,
    };
  } catch (err) {
    console.error('[PlaylistService] Error adding song:', err);
    return null;
  }
}

export async function updatePlaylistSong(
  songId: string,
  input: UpdateSongInput,
  coupleId: string
): Promise<PlaylistSong | null> {
  const { title, artist, linkUrl, storagePath, note } = input;

  try {
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

    let audioUrl: string | undefined = undefined;
    if (storagePath) {
      const signed = await getSignedUrl('playlist-audio', storagePath, 7200);
      audioUrl = signed || (storagePath.startsWith('data:') ? storagePath : undefined);
    }

    if (error || !data) {
      console.warn('[PlaylistService] Update note:', error?.message);
      return {
        id: songId,
        couple_id: coupleId,
        added_by_id: 'current-user',
        title,
        artist,
        link_url: linkUrl || null,
        storage_path: storagePath || null,
        audio_url: audioUrl,
        note: note || null,
        created_at: new Date().toISOString(),
      };
    }

    return {
      ...(data as PlaylistSong),
      audio_url: audioUrl,
    };
  } catch (err) {
    console.error('[PlaylistService] Error updating song:', err);
    return null;
  }
}

export async function deletePlaylistSong(
  songId: string,
  storagePath?: string | null
): Promise<boolean> {
  try {
    // 1. Delete associated audio file from storage
    if (storagePath) {
      await deleteAudioFile(storagePath);
    }

    // 2. Delete database record
    const { error } = await supabase.from('playlist_songs').delete().eq('id', songId);
    if (error) {
      console.warn('[PlaylistService] Delete DB note:', error.message);
    }

    return true;
  } catch (err) {
    console.error('[PlaylistService] Error deleting song:', err);
    return false;
  }
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
