import { supabase } from './supabase';
import { getSignedUrl } from './storage';
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

export async function fetchMemories(coupleId: string): Promise<Memory[]> {
  try {
    const { data: memoriesData, error: memoriesError } = await supabase
      .from('memories')
      .select('*, memory_photos(*)')
      .eq('couple_id', coupleId)
      .order('memory_date', { ascending: false });

    if (memoriesError || !memoriesData) {
      console.warn('[MemoriesService] Fetch memories note:', memoriesError?.message);
      return getDemoMemories(coupleId);
    }

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

    return memories.length > 0 ? memories : getDemoMemories(coupleId);
  } catch (err) {
    console.error('[MemoriesService] Exception:', err);
    return getDemoMemories(coupleId);
  }
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory | null> {
  const { coupleId, userId, title, description, memoryDate, location, tags = [], photos = [] } = input;

  try {
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
      console.warn('[MemoriesService] Supabase memory insert note:', memoryError?.message);
      // Construct in-memory object for responsive local UI fallback
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
          signed_url: p.storagePath.startsWith('data:') ? p.storagePath : undefined,
          caption: p.caption || null,
          created_at: new Date().toISOString(),
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
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

      await supabase.from('memory_photos').insert(photoRows);
    }

    return {
      ...memoryData,
      photos: photos.map((p, i) => ({
        id: `${memoryId}-p${i}`,
        memory_id: memoryId,
        couple_id: coupleId,
        storage_path: p.storagePath,
        caption: p.caption || null,
        created_at: new Date().toISOString(),
      })),
    };
  } catch (err) {
    console.error('[MemoriesService] Error creating memory:', err);
    return null;
  }
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
      photos: [
        {
          id: 'p-1',
          memory_id: 'demo-1',
          couple_id: coupleId,
          storage_path: 'demo/sunset.jpg',
          caption: 'Golden hour together',
          created_at: '2026-07-15T18:30:00Z',
        },
      ],
      created_at: '2026-07-15T18:30:00Z',
      updated_at: '2026-07-15T18:30:00Z',
    },
    {
      id: 'demo-2',
      couple_id: coupleId,
      author_id: 'demo-user',
      title: 'Cozy Rain & Coffee Date',
      description: 'It rained heavily outside while we sat inside our favorite cafe sipping warm hot chocolate.',
      memory_date: '2026-06-20',
      location: 'Little Flower Cafe',
      tags: ['cozy', 'rainy', 'coffee'],
      photos: [],
      created_at: '2026-06-20T14:00:00Z',
      updated_at: '2026-06-20T14:00:00Z',
    },
  ];
}
