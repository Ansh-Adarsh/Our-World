import { supabase, isPlaceholder } from './supabase';
import type { DiaryEntry, DiaryVisibility } from '@/types';

export interface CreateDiaryEntryInput {
  coupleId: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  visibility: DiaryVisibility;
  entryDate?: string;
}

export interface UpdateDiaryEntryInput {
  title: string;
  content: string;
  mood?: string;
  visibility: DiaryVisibility;
  entryDate?: string;
}

export async function fetchDiaryEntries(coupleId: string, userId: string): Promise<DiaryEntry[]> {
  if (isPlaceholder) {
    return getDemoDiaryEntries(coupleId, userId);
  }
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('couple_id', coupleId)
      .order('entry_date', { ascending: false });

    if (error) {
      console.error('[DiaryService] Fetch diary entries error:', error.message);
      throw new Error(error.message);
    }

    return (data as DiaryEntry[]) || [];
  } catch (err) {
    console.error('[DiaryService] Exception in fetchDiaryEntries:', err);
    throw err;
  }
}

export async function createDiaryEntry(input: CreateDiaryEntryInput): Promise<DiaryEntry> {
  const { coupleId, userId, title, content, mood, visibility, entryDate } = input;

  if (isPlaceholder) {
    return {
      id: crypto.randomUUID(),
      couple_id: coupleId,
      author_id: userId,
      title,
      content,
      mood: mood || '💖',
      visibility,
      entry_date: entryDate || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('diary_entries')
    .insert({
      couple_id: coupleId,
      author_id: userId,
      title,
      content,
      mood: mood || '💖',
      visibility,
      entry_date: entryDate || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[DiaryService] Create diary entry failed:', error?.message);
    throw new Error(error?.message || 'Failed to save diary entry');
  }

  return data as DiaryEntry;
}

export async function updateDiaryEntry(
  entryId: string,
  input: UpdateDiaryEntryInput
): Promise<DiaryEntry> {
  const { title, content, mood, visibility, entryDate } = input;

  if (isPlaceholder) {
    return {
      id: entryId,
      couple_id: 'mock-couple-id',
      author_id: 'mock-user-id',
      title,
      content,
      mood: mood || '💖',
      visibility,
      entry_date: entryDate || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('diary_entries')
    .update({
      title,
      content,
      mood: mood || '💖',
      visibility,
      ...(entryDate ? { entry_date: entryDate } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error || !data) {
    console.error('[DiaryService] Update diary entry failed:', error?.message);
    throw new Error(error?.message || 'Failed to update diary entry');
  }

  return data as DiaryEntry;
}

export async function deleteDiaryEntry(entryId: string): Promise<boolean> {
  if (isPlaceholder) return true;

  const { error } = await supabase.from('diary_entries').delete().eq('id', entryId);
  if (error) {
    console.error('[DiaryService] Delete entry failed:', error.message);
    throw new Error(error.message);
  }
  return true;
}

function getDemoDiaryEntries(coupleId: string, userId: string): DiaryEntry[] {
  return [
    {
      id: 'diary-demo-1',
      couple_id: coupleId,
      author_id: userId,
      title: 'Our quiet morning together',
      content: 'Woke up early today and made warm cinnamon tea. Sitting on the balcony watching the sunrise in complete peace.',
      mood: '🌅',
      visibility: 'SHARED',
      entry_date: '2026-08-02',
      created_at: '2026-08-02T08:00:00Z',
      updated_at: '2026-08-02T08:00:00Z',
    },
  ];
}
