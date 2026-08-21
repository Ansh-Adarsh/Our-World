import { supabase, isPlaceholder } from './supabase';
import type { Surprise, SurpriseQuestion, SurpriseOccasion, SurpriseStatus } from '@/types';

export interface CreateSurpriseInput {
  coupleId: string;
  creatorId: string;
  recipientId: string;
  occasion: SurpriseOccasion;
  title: string;
  letterMessage?: string;
  coverPhotoUrl?: string;
  musicUrl?: string;
  status?: SurpriseStatus;
  questions?: Omit<SurpriseQuestion, 'id' | 'surprise_id'>[];
}

export interface UpdateSurpriseInput {
  title?: string;
  occasion?: SurpriseOccasion;
  letterMessage?: string;
  coverPhotoUrl?: string;
  musicUrl?: string;
  status?: SurpriseStatus;
}

function getLocalSurprises(coupleId: string): Surprise[] {
  try {
    const raw = localStorage.getItem(`ourworld_surprises_${coupleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSurprises(coupleId: string, list: Surprise[]) {
  try {
    localStorage.setItem(`ourworld_surprises_${coupleId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('[SurpriseService] LocalStorage save note:', e);
  }
}

export async function fetchSurprisesByCreator(coupleId: string, creatorId: string): Promise<Surprise[]> {
  const localList = getLocalSurprises(coupleId).filter((s) => s.creator_id === creatorId);

  if (isPlaceholder || !coupleId) {
    return localList;
  }

  try {
    const { data: surprisesData, error: surprisesError } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('couple_id', coupleId)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (surprisesError) {
      console.warn('[SurpriseService] Remote fetch notice, using local surprises:', surprisesError.message);
      return localList;
    }

    if (!surprisesData || surprisesData.length === 0) {
      return localList;
    }

    const remoteSurprises: Surprise[] = surprisesData.map((s: any) => ({
      ...s,
      letter_message: s.letter_message || s.message || null,
      questions: (s.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    }));

    const mergedMap = new Map<string, Surprise>();
    localList.forEach((s) => mergedMap.set(s.id, s));
    remoteSurprises.forEach((s) => mergedMap.set(s.id, s));

    const combined = Array.from(mergedMap.values());
    saveLocalSurprises(coupleId, combined);
    return combined;
  } catch (err) {
    console.warn('[SurpriseService] Fetch exception, returning local cache:', err);
    return localList;
  }
}

export async function fetchSurprisesForRecipient(coupleId: string, recipientId: string): Promise<Surprise[]> {
  const localList = getLocalSurprises(coupleId).filter(
    (s) => (s.recipient_id === recipientId || s.recipient_id === 'partner') && s.status === 'published'
  );

  if (isPlaceholder || !coupleId) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('couple_id', coupleId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[SurpriseService] Remote recipient fetch notice, using local cache:', error.message);
      return localList;
    }

    if (!data || data.length === 0) {
      return localList;
    }

    const remoteList: Surprise[] = data.map((s: any) => ({
      ...s,
      letter_message: s.letter_message || s.message || null,
      questions: (s.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    }));

    const mergedMap = new Map<string, Surprise>();
    localList.forEach((s) => mergedMap.set(s.id, s));
    remoteList.forEach((s) => mergedMap.set(s.id, s));

    return Array.from(mergedMap.values());
  } catch {
    return localList;
  }
}

export async function fetchSurprisesForCouple(coupleId: string, _userId?: string): Promise<Surprise[]> {
  if (isPlaceholder || !coupleId) {
    return getLocalSurprises(coupleId);
  }

  const localSurprises = getLocalSurprises(coupleId);

  try {
    const { data: surprisesData, error: surprisesError } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (surprisesError) {
      console.warn('[SurpriseService] Remote fetch notice, using local surprises:', surprisesError.message);
      return localSurprises;
    }

    if (!surprisesData || surprisesData.length === 0) {
      return localSurprises;
    }

    const remoteSurprises: Surprise[] = surprisesData.map((s: any) => ({
      ...s,
      letter_message: s.letter_message || s.message || null,
      questions: (s.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    }));

    const mergedMap = new Map<string, Surprise>();
    localSurprises.forEach((s) => mergedMap.set(s.id, s));
    remoteSurprises.forEach((s) => mergedMap.set(s.id, s));

    const combined = Array.from(mergedMap.values());
    saveLocalSurprises(coupleId, combined);
    return combined;
  } catch {
    return localSurprises;
  }
}

export async function fetchSurpriseById(surpriseId: string): Promise<Surprise | null> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ourworld_surprises_')) {
      try {
        const list: Surprise[] = JSON.parse(localStorage.getItem(key) || '[]');
        const found = list.find((s) => s.id === surpriseId);
        if (found) return found;
      } catch {}
    }
  }

  if (isPlaceholder) return null;

  try {
    const { data, error } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('id', surpriseId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      letter_message: data.letter_message || data.message || null,
      questions: (data.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    };
  } catch (err) {
    console.warn('[SurpriseService] fetchSurpriseById exception:', err);
    return null;
  }
}

export async function fetchActivePublishedSurprise(
  coupleId: string,
  _recipientId?: string
): Promise<Surprise | null> {
  const localList = getLocalSurprises(coupleId);
  const localActive = localList.find((s) => s.status === 'published');

  if (isPlaceholder || !coupleId) {
    return localActive || null;
  }

  try {
    const { data, error } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('couple_id', coupleId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localActive || null;
    }

    return {
      ...data,
      letter_message: data.letter_message || data.message || null,
      questions: (data.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    };
  } catch {
    return localActive || null;
  }
}

export async function createSurprise(input: CreateSurpriseInput): Promise<Surprise> {
  const {
    coupleId,
    creatorId,
    recipientId,
    occasion,
    title,
    letterMessage,
    coverPhotoUrl,
    musicUrl,
    status = 'draft',
    questions = [],
  } = input;

  const newId = crypto.randomUUID();
  const createdLocal: Surprise = {
    id: newId,
    couple_id: coupleId,
    creator_id: creatorId,
    recipient_id: recipientId,
    occasion,
    title,
    letter_message: letterMessage || null,
    cover_photo_url: coverPhotoUrl || null,
    music_url: musicUrl || null,
    status,
    is_viewed: false,
    viewed_at: null,
    questions: questions.map((q, idx) => ({
      id: `local-q-${idx}`,
      surprise_id: newId,
      question_order: q.question_order || idx + 1,
      question_type: q.question_type || 'playful_choice',
      question_text: q.question_text,
      yes_text: q.yes_text || 'Yes ❤️',
      no_text: q.no_text || 'No 😂',
      no_button_behavior: q.no_button_behavior || 'escape',
      hint: q.hint || null,
      reveal_message: q.reveal_message || null,
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = getLocalSurprises(coupleId);
  saveLocalSurprises(coupleId, [createdLocal, ...existing]);

  if (isPlaceholder || !coupleId) {
    return createdLocal;
  }

  try {
    const { data: surpriseData, error: surpriseError } = await supabase
      .from('surprises')
      .insert({
        id: newId,
        couple_id: coupleId,
        creator_id: creatorId,
        recipient_id: recipientId,
        occasion,
        title,
        letter_message: letterMessage || null,
        cover_photo_url: coverPhotoUrl || null,
        music_url: musicUrl || null,
        status,
      })
      .select()
      .single();

    if (surpriseError || !surpriseData) {
      console.warn('[SurpriseService] Remote insert notice, saved locally:', surpriseError?.message);
      return createdLocal;
    }

    if (questions.length > 0) {
      const qRows = questions.map((q, idx) => ({
        surprise_id: newId,
        question_order: q.question_order || idx + 1,
        question_type: q.question_type || 'playful_choice',
        question_text: q.question_text,
        yes_text: q.yes_text || 'Yes ❤️',
        no_text: q.no_text || 'No 😂',
        no_button_behavior: q.no_button_behavior || 'escape',
        hint: q.hint || null,
        reveal_message: q.reveal_message || null,
      }));

      await supabase.from('surprise_questions').insert(qRows);
    }

    return createdLocal;
  } catch (err) {
    console.warn('[SurpriseService] createSurprise exception, persisting locally:', err);
    return createdLocal;
  }
}

export async function saveSurpriseQuestions(
  surpriseId: string,
  questions: (Omit<SurpriseQuestion, 'id' | 'surprise_id'> & { id?: string })[],
  coupleId?: string
): Promise<SurpriseQuestion[]> {
  const formattedQuestions: SurpriseQuestion[] = questions.map((q, idx) => ({
    id: q.id || `local-q-${idx}`,
    surprise_id: surpriseId,
    question_order: q.question_order || idx + 1,
    question_type: q.question_type || 'playful_choice',
    question_text: q.question_text,
    yes_text: q.yes_text || 'Yes ❤️',
    no_text: q.no_text || 'No 😂',
    no_button_behavior: q.no_button_behavior || 'escape',
    hint: q.hint || null,
    reveal_message: q.reveal_message || null,
  }));

  if (coupleId) {
    const existing = getLocalSurprises(coupleId);
    saveLocalSurprises(
      coupleId,
      existing.map((s) => (s.id === surpriseId ? { ...s, questions: formattedQuestions } : s))
    );
  }

  return formattedQuestions;
}

export async function updateSurprise(surpriseId: string, input: UpdateSurpriseInput, coupleId?: string): Promise<Surprise> {
  const targetCoupleId = coupleId || 'default-couple';
  const existing = getLocalSurprises(targetCoupleId);
  const found = existing.find((s) => s.id === surpriseId);

  const updated: Surprise = {
    ...(found || {
      id: surpriseId,
      couple_id: targetCoupleId,
      creator_id: 'user',
      recipient_id: 'partner',
      occasion: input.occasion || 'birthday',
      title: input.title || 'Surprise',
      status: input.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    ...input,
    updated_at: new Date().toISOString(),
  };

  saveLocalSurprises(
    targetCoupleId,
    existing.map((s) => (s.id === surpriseId ? updated : s))
  );

  if (isPlaceholder || !coupleId) {
    return updated;
  }

  try {
    await supabase.from('surprises').update(input).eq('id', surpriseId);
    return updated;
  } catch {
    return updated;
  }
}

export async function publishSurprise(surpriseId: string, coupleId?: string): Promise<Surprise> {
  return updateSurprise(surpriseId, { status: 'published' }, coupleId);
}

export async function unpublishSurprise(surpriseId: string, coupleId?: string): Promise<Surprise> {
  return updateSurprise(surpriseId, { status: 'draft' }, coupleId);
}

export async function deleteSurprise(surpriseId: string, _coupleId?: string): Promise<boolean> {
  // Remove from all local sanctuary storage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ourworld_surprises_')) {
      try {
        const list: Surprise[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((s) => s.id !== surpriseId);
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch {}
    }
  }

  if (isPlaceholder) return true;

  try {
    const { error } = await supabase.from('surprises').delete().eq('id', surpriseId);
    if (error) {
      console.warn('[SurpriseService] Remote delete notice:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('[SurpriseService] deleteSurprise exception:', err);
    return true;
  }
}

export async function markSurpriseViewed(surpriseId: string): Promise<void> {
  if (isPlaceholder || !surpriseId) return;

  try {
    await supabase
      .from('surprises')
      .update({ is_viewed: true, viewed_at: new Date().toISOString() })
      .eq('id', surpriseId);
  } catch {}
}
