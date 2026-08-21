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

function getLocalDiary(coupleId: string): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(`ourworld_diary_${coupleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDiary(coupleId: string, list: DiaryEntry[]) {
  try {
    localStorage.setItem(`ourworld_diary_${coupleId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('[DiaryService] LocalStorage save note:', e);
  }
}

export async function fetchDiaryEntries(coupleId: string, _userId?: string): Promise<DiaryEntry[]> {
  if (isPlaceholder || !coupleId) {
    return getLocalDiary(coupleId);
  }

  const localEntries = getLocalDiary(coupleId);

  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('couple_id', coupleId)
      .order('entry_date', { ascending: false });

    if (error) {
      console.warn('[DiaryService] Remote fetch notice, using local cache:', error.message);
      return localEntries;
    }

    if (!data || data.length === 0) {
      return localEntries;
    }

    const remoteEntries = data as DiaryEntry[];
    const mergedMap = new Map<string, DiaryEntry>();
    localEntries.forEach((e) => mergedMap.set(e.id, e));
    remoteEntries.forEach((e) => mergedMap.set(e.id, e));

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    saveLocalDiary(coupleId, combined);
    return combined;
  } catch (err) {
    console.warn('[DiaryService] Fetch exception, returning local cache:', err);
    return localEntries;
  }
}

export async function createDiaryEntry(input: CreateDiaryEntryInput): Promise<DiaryEntry> {
  const { coupleId, userId, title, content, mood, visibility, entryDate } = input;

  const localId = crypto.randomUUID();
  const localNewEntry: DiaryEntry = {
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

  if (isPlaceholder || !coupleId) {
    const existing = getLocalDiary(coupleId);
    saveLocalDiary(coupleId, [localNewEntry, ...existing]);
    return localNewEntry;
  }

  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        id: localId,
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
      console.warn('[DiaryService] Remote insert notice, persisting locally:', error?.message);
      const existing = getLocalDiary(coupleId);
      saveLocalDiary(coupleId, [localNewEntry, ...existing]);
      return localNewEntry;
    }

    const createdRecord = data as DiaryEntry;
    const existing = getLocalDiary(coupleId);
    saveLocalDiary(coupleId, [createdRecord, ...existing.filter((e) => e.id !== localId)]);
    return createdRecord;
  } catch (err) {
    console.warn('[DiaryService] createDiaryEntry exception, persisting locally:', err);
    const existing = getLocalDiary(coupleId);
    saveLocalDiary(coupleId, [localNewEntry, ...existing]);
    return localNewEntry;
  }
}

export async function updateDiaryEntry(
  entryId: string,
  input: UpdateDiaryEntryInput,
  coupleId?: string
): Promise<DiaryEntry> {
  const { title, content, mood, visibility, entryDate } = input;
  const targetCoupleId = coupleId || 'default-couple';

  const existing = getLocalDiary(targetCoupleId);
  const updatedLocal: DiaryEntry = {
    id: entryId,
    couple_id: targetCoupleId,
    author_id: 'user',
    title,
    content,
    mood: mood || '💖',
    visibility,
    entry_date: entryDate || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalDiary(
    targetCoupleId,
    existing.map((e) => (e.id === entryId ? { ...e, ...updatedLocal } : e))
  );

  if (isPlaceholder || !coupleId) {
    return updatedLocal;
  }

  try {
    await supabase
      .from('diary_entries')
      .update({
        title,
        content,
        mood: mood || '💖',
        visibility,
        entry_date: entryDate || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    return updatedLocal;
  } catch (err) {
    console.warn('[DiaryService] updateDiaryEntry notice:', err);
    return updatedLocal;
  }
}

export async function deleteDiaryEntry(entryId: string, coupleId?: string): Promise<boolean> {
  if (coupleId) {
    const existing = getLocalDiary(coupleId);
    saveLocalDiary(
      coupleId,
      existing.filter((e) => e.id !== entryId)
    );
  }

  if (isPlaceholder || !coupleId) {
    return true;
  }

  try {
    const { error } = await supabase.from('diary_entries').delete().eq('id', entryId);
    if (error) {
      console.warn('[DiaryService] Remote delete notice:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('[DiaryService] deleteDiaryEntry exception:', err);
    return true;
  }
}
