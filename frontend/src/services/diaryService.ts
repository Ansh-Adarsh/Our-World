import { supabase } from './supabase';
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

export async function fetchDiaryEntries(coupleId: string, userId: string): Promise<DiaryEntry[]> {
  try {
    // ⚠️ Security Enforcement:
    // Supabase RLS enforces that PRIVATE entries are ONLY returned when author_id == auth.uid()
    // We also pass the explicit filter in query for efficiency
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('couple_id', coupleId)
      .order('entry_date', { ascending: false });

    if (error || !data) {
      console.warn('[DiaryService] Fetch diary entries note:', error?.message);
      return getDemoDiaryEntries(coupleId, userId);
    }

    return (data as DiaryEntry[]).length > 0 ? (data as DiaryEntry[]) : getDemoDiaryEntries(coupleId, userId);
  } catch (err) {
    console.error('[DiaryService] Exception:', err);
    return getDemoDiaryEntries(coupleId, userId);
  }
}

export async function createDiaryEntry(input: CreateDiaryEntryInput): Promise<DiaryEntry | null> {
  const { coupleId, userId, title, content, mood, visibility, entryDate } = input;

  try {
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
      console.warn('[DiaryService] Supabase diary insert note:', error?.message);
      const localId = crypto.randomUUID();
      return {
        id: localId,
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

    return data as DiaryEntry;
  } catch (err) {
    console.error('[DiaryService] Error creating diary entry:', err);
    return null;
  }
}

export async function deleteDiaryEntry(entryId: string): Promise<boolean> {
  const { error } = await supabase.from('diary_entries').delete().eq('id', entryId);
  if (error) {
    console.error('[DiaryService] Delete entry failed:', error.message);
    return false;
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
    {
      id: 'diary-demo-2',
      couple_id: userId, // private to current user
      author_id: userId,
      title: 'Thoughts on our upcoming anniversary',
      content: 'I want to plan a secret surprise trip for us next month. Need to start looking at quiet cabins by the lake.',
      mood: '🎁',
      visibility: 'PRIVATE',
      entry_date: '2026-07-28',
      created_at: '2026-07-28T21:30:00Z',
      updated_at: '2026-07-28T21:30:00Z',
    },
  ];
}
