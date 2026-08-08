import { supabase } from './supabase';
import type { PlaylistSong } from '@/types';

export interface CreateSongInput {
  coupleId: string;
  addedById: string;
  title: string;
  artist: string;
  linkUrl?: string;
  note?: string;
}

export async function fetchPlaylistSongs(coupleId: string): Promise<PlaylistSong[]> {
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

    return (data as PlaylistSong[]).length > 0 ? (data as PlaylistSong[]) : getDemoSongs(coupleId);
  } catch (err) {
    console.error('[PlaylistService] Exception:', err);
    return getDemoSongs(coupleId);
  }
}

export async function addPlaylistSong(input: CreateSongInput): Promise<PlaylistSong | null> {
  const { coupleId, addedById, title, artist, linkUrl, note } = input;

  try {
    const { data, error } = await supabase
      .from('playlist_songs')
      .insert({
        couple_id: coupleId,
        added_by_id: addedById,
        title,
        artist,
        link_url: linkUrl || null,
        note: note || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('[PlaylistService] Insert note:', error?.message);
      return {
        id: crypto.randomUUID(),
        couple_id: coupleId,
        added_by_id: addedById,
        title,
        artist,
        link_url: linkUrl || null,
        note: note || null,
        created_at: new Date().toISOString(),
      };
    }

    return data as PlaylistSong;
  } catch (err) {
    console.error('[PlaylistService] Error adding song:', err);
    return null;
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
