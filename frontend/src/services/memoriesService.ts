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

function getLocalMemories(coupleId: string): Memory[] {
  try {
    const raw = localStorage.getItem(`ourworld_memories_${coupleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMemories(coupleId: string, list: Memory[]) {
  try {
    localStorage.setItem(`ourworld_memories_${coupleId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('[MemoriesService] LocalStorage save note:', e);
  }
}

export async function fetchMemories(coupleId: string): Promise<Memory[]> {
  if (isPlaceholder || !coupleId) {
    return getLocalMemories(coupleId);
  }

  const localMems = getLocalMemories(coupleId);

  try {
    const { data: memoriesData, error: memoriesError } = await supabase
      .from('memories')
      .select('*, memory_photos(*)')
      .eq('couple_id', coupleId)
      .order('memory_date', { ascending: false });

    if (memoriesError) {
      console.warn('[MemoriesService] Remote fetch notice, using local cache:', memoriesError.message);
      return localMems;
    }

    if (!memoriesData || memoriesData.length === 0) {
      return localMems;
    }

    // Process signed URLs for photos
    const remoteMemories: Memory[] = await Promise.all(
      memoriesData.map(async (m) => {
        const rawPhotos = (m.memory_photos as MemoryPhoto[]) || [];
        const photosWithUrls = await Promise.all(
          rawPhotos.map(async (p) => {
            const signedUrl = await getSignedUrl('memories-photos', p.storage_path);
            return {
              ...p,
              signed_url: signedUrl || (p.storage_path.startsWith('data:') ? p.storage_path : undefined),
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

    // Merge remote with any un-synced local memories
    const mergedMap = new Map<string, Memory>();
    localMems.forEach((m) => mergedMap.set(m.id, m));
    remoteMemories.forEach((m) => mergedMap.set(m.id, m));

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime()
    );

    saveLocalMemories(coupleId, combined);
    return combined;
  } catch (err) {
    console.warn('[MemoriesService] Fetch exception, returning local cache:', err);
    return localMems;
  }
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const { coupleId, userId, title, description, memoryDate, location, tags = [], photos = [] } = input;

  const localId = crypto.randomUUID();
  const fallbackPhotos: MemoryPhoto[] = photos.map((p, i) => ({
    id: `${localId}-p${i}`,
    memory_id: localId,
    couple_id: coupleId,
    storage_path: p.storagePath,
    signed_url: p.storagePath.startsWith('data:') || p.storagePath.startsWith('http') ? p.storagePath : undefined,
    caption: p.caption || null,
    created_at: new Date().toISOString(),
  }));

  const localNewMem: Memory = {
    id: localId,
    couple_id: coupleId,
    author_id: userId,
    title,
    description: description || null,
    memory_date: memoryDate,
    location: location || null,
    tags,
    photos: fallbackPhotos,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isPlaceholder || !coupleId) {
    const existing = getLocalMemories(coupleId);
    saveLocalMemories(coupleId, [localNewMem, ...existing]);
    return localNewMem;
  }

  try {
    const { data: memoryData, error: memoryError } = await supabase
      .from('memories')
      .insert({
        id: localId,
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
      console.warn('[MemoriesService] Remote insert notice, persisting locally:', memoryError?.message);
      const existing = getLocalMemories(coupleId);
      saveLocalMemories(coupleId, [localNewMem, ...existing]);
      return localNewMem;
    }

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
        console.warn('[MemoriesService] Remote photo insert notice:', photoError.message);
      }
    }

    const createdRecord: Memory = {
      ...memoryData,
      photos: fallbackPhotos,
    };

    const existing = getLocalMemories(coupleId);
    saveLocalMemories(coupleId, [createdRecord, ...existing.filter((m) => m.id !== localId)]);
    return createdRecord;
  } catch (err) {
    console.warn('[MemoriesService] createMemory exception, persisting locally:', err);
    const existing = getLocalMemories(coupleId);
    saveLocalMemories(coupleId, [localNewMem, ...existing]);
    return localNewMem;
  }
}

export async function updateMemory(
  memoryId: string,
  input: UpdateMemoryInput,
  coupleId?: string
): Promise<Memory> {
  const { title, description, memoryDate, location, tags = [], photos = [] } = input;
  const targetCoupleId = coupleId || 'default-couple';

  const existing = getLocalMemories(targetCoupleId);
  const updatedLocal: Memory = {
    id: memoryId,
    couple_id: targetCoupleId,
    author_id: 'user',
    title,
    description: description || null,
    memory_date: memoryDate,
    location: location || null,
    tags,
    photos: photos.map((p, i) => ({
      id: `${memoryId}-p${i}`,
      memory_id: memoryId,
      couple_id: targetCoupleId,
      storage_path: p.storagePath,
      signed_url: p.storagePath.startsWith('data:') || p.storagePath.startsWith('http') ? p.storagePath : undefined,
      caption: p.caption || null,
      created_at: new Date().toISOString(),
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalMemories(
    targetCoupleId,
    existing.map((m) => (m.id === memoryId ? { ...m, ...updatedLocal } : m))
  );

  if (isPlaceholder || !coupleId) {
    return updatedLocal;
  }

  try {
    await supabase
      .from('memories')
      .update({
        title,
        description: description || null,
        memory_date: memoryDate,
        location: location || null,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId);

    return updatedLocal;
  } catch (err) {
    console.warn('[MemoriesService] updateMemory notice:', err);
    return updatedLocal;
  }
}

export async function deleteMemory(
  memoryId: string,
  coupleIdOrPhotos?: string | string[],
  _coupleId?: string
): Promise<boolean> {
  // If photo paths passed, clean storage
  if (Array.isArray(coupleIdOrPhotos)) {
    coupleIdOrPhotos.forEach((path) => {
      void deleteMemoryPhoto(path);
    });
  }

  // Remove from all local sanctuary storage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ourworld_memories_')) {
      try {
        const list: Memory[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((m) => m.id !== memoryId);
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch {}
    }
  }

  if (isPlaceholder) {
    return true;
  }

  try {
    const { error } = await supabase.from('memories').delete().eq('id', memoryId);
    if (error) {
      console.warn('[MemoriesService] Remote delete notice:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('[MemoriesService] deleteMemory exception:', err);
    return true;
  }
}

export function subscribeToMemories(coupleId: string, onUpdate: () => void) {
  if (isPlaceholder || !coupleId) return null;

  return supabase
    .channel(`couple-memories-${coupleId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'memories', filter: `couple_id=eq.${coupleId}` },
      () => onUpdate()
    )
    .subscribe();
}
