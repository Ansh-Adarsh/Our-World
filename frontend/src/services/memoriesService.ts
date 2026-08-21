import { supabase, isPlaceholder } from './supabase';
import { getSignedUrl, deleteMemoryPhoto } from './storage';
import type { Memory, MemoryPhoto } from '@/types';

export interface CreateMemoryInput {
  coupleId: string;
  userId: string;
  title: string;
  description?: string;
  memoryDate: string;
  location?: string;
  tags?: string[];
  photos?: { storagePath: string; caption?: string }[];
}

export interface UpdateMemoryInput {
  title: string;
  description?: string;
  memoryDate: string;
  location?: string;
  tags?: string[];
  photos?: { storagePath: string; caption?: string }[];
}

export async function fetchMemories(coupleId: string): Promise<Memory[]> {
  if (isPlaceholder) {
    return getDemoMemories(coupleId);
  }
  try {
    const { data: memoriesData, error: memoriesError } = await supabase
      .from('memories')
      .select('*, memory_photos(*)')
      .eq('couple_id', coupleId)
      .order('memory_date', { ascending: false });

    if (memoriesError) {
      console.error('[MemoriesService] Fetch memories error:', memoriesError.message);
      throw new Error(memoriesError.message);
    }

    if (!memoriesData) return [];

    // Process signed URLs for photos
    const memories: Memory[] = await Promise.all(
      memoriesData.map(async (m) => {
        const rawPhotos = (m.memory_photos as MemoryPhoto[]) || [];
        const photosWithUrls = await Promise.all(
          rawPhotos.map(async (p) => {
            const signedUrl = await getSignedUrl('memories-photos', p.storage_path);
            return {
              ...p,
              signed_url: signedUrl || undefined,
            };
          })
        );

        return {
          id: m.id,
          couple_id: m.couple_id,
          author_id: m.author_id,
          title: m.title,
          description: m.description,
          memory_date: m.memory_date,
          location: m.location,
          tags: m.tags || [],
          photos: photosWithUrls,
          created_at: m.created_at,
          updated_at: m.updated_at,
        };
      })
    );

    return memories;
  } catch (err) {
    console.error('[MemoriesService] Exception in fetchMemories:', err);
    throw err;
  }
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const { coupleId, userId, title, description, memoryDate, location, tags = [], photos = [] } = input;

  if (isPlaceholder) {
    const localId = crypto.randomUUID();
    return {
      id: localId,
      couple_id: coupleId,
      author_id: userId,
      title,
      description: description || null,
      memory_date: memoryDate,
      location: location || null,
      tags,
      photos: photos.map((p, i) => ({
        id: `${localId}-p${i}`,
        memory_id: localId,
        couple_id: coupleId,
        storage_path: p.storagePath,
        signed_url: p.storagePath.startsWith('data:') || p.storagePath.startsWith('blob:') ? p.storagePath : undefined,
        caption: p.caption || null,
        created_at: new Date().toISOString(),
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // 1. Insert memory row
  const { data: memoryData, error: memoryError } = await supabase
    .from('memories')
    .insert({
      couple_id: coupleId,
      author_id: userId,
      title,
      description: description || null,
      memory_date: memoryDate,
      location: location || null,
      tags,
    })
    .select()
    .single();

  if (memoryError || !memoryData) {
    console.error('[MemoriesService] Create memory error:', memoryError?.message);
    throw new Error(memoryError?.message || 'Failed to create memory');
  }

  // 2. Insert photo metadata rows
  const memoryId = memoryData.id;
  if (photos.length > 0) {
    const photoRows = photos.map((p) => ({
      memory_id: memoryId,
      couple_id: coupleId,
      storage_path: p.storagePath,
      caption: p.caption || null,
    }));

    const { error: photoError } = await supabase.from('memory_photos').insert(photoRows);
    if (photoError) {
      console.error('[MemoriesService] Photo insert error:', photoError.message);
    }
  }

  const photosWithUrls = await Promise.all(
    photos.map(async (p, i) => {
      const signedUrl = await getSignedUrl('memories-photos', p.storagePath);
      return {
        id: `${memoryId}-p${i}`,
        memory_id: memoryId,
        couple_id: coupleId,
        storage_path: p.storagePath,
        signed_url: signedUrl || (p.storagePath.startsWith('data:') ? p.storagePath : undefined),
        caption: p.caption || null,
        created_at: new Date().toISOString(),
      };
    })
  );

  return {
    ...memoryData,
    photos: photosWithUrls,
  };
}

export async function updateMemory(
  memoryId: string,
  input: UpdateMemoryInput,
  coupleId: string
): Promise<Memory> {
  const { title, description, memoryDate, location, tags = [], photos = [] } = input;

  if (isPlaceholder) {
    return {
      id: memoryId,
      couple_id: coupleId,
      author_id: 'mock-user',
      title,
      description: description || null,
      memory_date: memoryDate,
      location: location || null,
      tags,
      photos: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data: updatedMemory, error } = await supabase
    .from('memories')
    .update({
      title,
      description: description || null,
      memory_date: memoryDate,
      location: location || null,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memoryId)
    .select()
    .single();

  if (error || !updatedMemory) {
    console.error('[MemoriesService] Update error:', error?.message);
    throw new Error(error?.message || 'Failed to update memory');
  }

  // Update photo rows: replace photos if provided
  if (photos.length > 0) {
    await supabase.from('memory_photos').delete().eq('memory_id', memoryId);
    const photoRows = photos.map((p) => ({
      memory_id: memoryId,
      couple_id: coupleId,
      storage_path: p.storagePath,
      caption: p.caption || null,
    }));
    await supabase.from('memory_photos').insert(photoRows);
  }

  const photosWithUrls = await Promise.all(
    photos.map(async (p, i) => {
      const signedUrl = await getSignedUrl('memories-photos', p.storagePath);
      return {
        id: `${memoryId}-p${i}`,
        memory_id: memoryId,
        couple_id: coupleId,
        storage_path: p.storagePath,
        signed_url: signedUrl || (p.storagePath.startsWith('data:') ? p.storagePath : undefined),
        caption: p.caption || null,
        created_at: new Date().toISOString(),
      };
    })
  );

  return {
    ...updatedMemory,
    photos: photosWithUrls,
  };
}

export async function deleteMemory(
  memoryId: string,
  photoPaths: string[] = []
): Promise<boolean> {
  if (isPlaceholder) return true;

  // 1. Delete associated photos from storage
  if (photoPaths.length > 0) {
    await Promise.all(photoPaths.map((path) => deleteMemoryPhoto(path)));
  }

  // 2. Delete database record (cascades to memory_photos)
  const { error } = await supabase.from('memories').delete().eq('id', memoryId);

  if (error) {
    console.error('[MemoriesService] Delete DB error:', error.message);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Realtime subscription to memories table changes
 */
export function subscribeToMemories(
  coupleId: string,
  onChange: () => void
) {
  return supabase
    .channel(`couple-memories-${coupleId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'memories',
        filter: `couple_id=eq.${coupleId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();
}

function getDemoMemories(coupleId: string): Memory[] {
  return [
    {
      id: 'demo-1',
      couple_id: coupleId,
      author_id: 'demo-user',
      title: 'Our First Sunset Walk',
      description: 'The sky turned shades of deep pink and lavender. We talked for hours by the water.',
      memory_date: '2026-07-15',
      location: 'Marine Drive',
      tags: ['romantic', 'sunset', 'firsts'],
      photos: [],
      created_at: '2026-07-15T18:30:00Z',
      updated_at: '2026-07-15T18:30:00Z',
    },
  ];
}
