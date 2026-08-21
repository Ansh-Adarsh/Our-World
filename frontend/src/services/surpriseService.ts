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

// In-memory fallback storage for offline/demo testing
const demoSurprises: Surprise[] = [
  {
    id: 'demo-surprise-1',
    couple_id: 'demo-couple',
    creator_id: 'demo-user-1',
    recipient_id: 'demo-user-2',
    occasion: 'birthday',
    title: 'A Special Birthday Surprise for My Favorite Soul',
    letter_message: 'Happy Birthday, my love! Every single second by your side is a gift I will treasure for the rest of my days. ❤️',
    cover_photo_url: null,
    music_url: null,
    status: 'published',
    is_viewed: false,
    viewed_at: null,
    questions: [
      {
        id: 'dq-1',
        surprise_id: 'demo-surprise-1',
        question_order: 1,
        question_type: 'playful_choice',
        question_text: 'Who fell in love first? 👀',
        yes_text: 'Obviously me ❤️',
        no_text: 'You wish 😂',
        no_button_behavior: 'escape',
        reveal_message: 'It was true love from the very first hello ✨',
      },
      {
        id: 'dq-2',
        surprise_id: 'demo-surprise-1',
        question_order: 2,
        question_type: 'playful_choice',
        question_text: 'Are you ready for the best celebration ever? 🎂',
        yes_text: 'Yes, absolutely! 🎉',
        no_text: 'Maybe... 👀',
        no_button_behavior: 'grow_yes',
        reveal_message: 'Make a wish, darling! The candles are waiting 🕯️',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fetch all surprises associated with the verified couple
 */
export async function fetchSurprisesForCouple(coupleId: string): Promise<Surprise[]> {
  if (isPlaceholder) {
    return demoSurprises.filter((s) => s.couple_id === coupleId);
  }

  try {
    const { data: surprisesData, error: surpriseError } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (surpriseError) {
      console.warn('[SurpriseService] Supabase query notice:', surpriseError.message);
      return demoSurprises;
    }

    if (!surprisesData) return [];

    return surprisesData.map((s: any) => ({
      ...s,
      letter_message: s.letter_message || s.message || null,
      questions: (s.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    }));
  } catch (err) {
    console.error('[SurpriseService] Exception fetching surprises:', err);
    return demoSurprises;
  }
}

/**
 * Fetch a single surprise by ID with its ordered questions
 */
export async function fetchSurpriseById(surpriseId: string): Promise<Surprise | null> {
  if (isPlaceholder) {
    return demoSurprises.find((s) => s.id === surpriseId) || null;
  }

  try {
    const { data, error } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('id', surpriseId)
      .single();

    if (error || !data) {
      console.warn('[SurpriseService] Surprise fetch notice:', error?.message);
      return demoSurprises.find((s) => s.id === surpriseId) || null;
    }

    return {
      ...data,
      letter_message: data.letter_message || data.message || null,
      questions: (data.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    };
  } catch (err) {
    console.error('[SurpriseService] Exception fetching surprise by id:', err);
    return null;
  }
}

/**
 * Fetch the latest published surprise for a recipient in a couple
 */
export async function fetchActivePublishedSurprise(
  coupleId: string,
  recipientId: string
): Promise<Surprise | null> {
  if (isPlaceholder) {
    return (
      demoSurprises.find(
        (s) => s.couple_id === coupleId && s.recipient_id === recipientId && s.status === 'published'
      ) ||
      demoSurprises[0] ||
      null
    );
  }

  try {
    const { data, error } = await supabase
      .from('surprises')
      .select('*, surprise_questions(*)')
      .eq('couple_id', coupleId)
      .eq('recipient_id', recipientId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback: check any published surprise in couple
      const { data: fallbackData } = await supabase
        .from('surprises')
        .select('*, surprise_questions(*)')
        .eq('couple_id', coupleId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackData) {
        return {
          ...fallbackData,
          letter_message: fallbackData.letter_message || fallbackData.message || null,
          questions: (fallbackData.surprise_questions || []).sort(
            (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
          ),
        };
      }
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
    console.error('[SurpriseService] Exception fetching active surprise:', err);
    return null;
  }
}

/**
 * Create a new surprise with optional initial questions
 */
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

  if (isPlaceholder) {
    const newId = crypto.randomUUID();
    const created: Surprise = {
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
    demoSurprises.unshift(created);
    return created;
  }

  try {
    // 1. Insert into surprises table
    const { data: surpriseData, error: surpriseError } = await supabase
      .from('surprises')
      .insert({
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
      console.error('[SurpriseService] Create surprise error:', surpriseError?.message);
      throw new Error(surpriseError?.message || 'Failed to create surprise in database');
    }

    const surpriseId = surpriseData.id;

    // 2. Insert questions if provided
    let insertedQuestions: SurpriseQuestion[] = [];
    if (questions.length > 0) {
      const questionRows = questions.map((q, idx) => ({
        surprise_id: surpriseId,
        question_order: q.question_order ?? idx + 1,
        question_type: q.question_type || 'playful_choice',
        question_text: q.question_text,
        yes_text: q.yes_text || 'Yes ❤️',
        no_text: q.no_text || 'No 😂',
        no_button_behavior: q.no_button_behavior || 'escape',
        hint: q.hint || null,
        reveal_message: q.reveal_message || null,
      }));

      const { data: qData, error: qError } = await supabase
        .from('surprise_questions')
        .insert(questionRows)
        .select();

      if (qError) {
        console.error('[SurpriseService] Insert questions error:', qError.message);
      } else if (qData) {
        insertedQuestions = qData as SurpriseQuestion[];
      }
    }

    return {
      ...surpriseData,
      questions: insertedQuestions.sort((a, b) => a.question_order - b.question_order),
    };
  } catch (err: any) {
    console.error('[SurpriseService] Exception in createSurprise:', err);
    throw err;
  }
}

/**
 * Update surprise properties
 */
export async function updateSurprise(
  surpriseId: string,
  updates: UpdateSurpriseInput
): Promise<Surprise> {
  if (isPlaceholder) {
    const idx = demoSurprises.findIndex((s) => s.id === surpriseId);
    if (idx !== -1) {
      demoSurprises[idx] = {
        ...demoSurprises[idx],
        ...updates,
        letter_message: updates.letterMessage !== undefined ? updates.letterMessage : demoSurprises[idx].letter_message,
        cover_photo_url: updates.coverPhotoUrl !== undefined ? updates.coverPhotoUrl : demoSurprises[idx].cover_photo_url,
        music_url: updates.musicUrl !== undefined ? updates.musicUrl : demoSurprises[idx].music_url,
        updated_at: new Date().toISOString(),
      };
      return demoSurprises[idx];
    }
  }

  try {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.occasion !== undefined) payload.occasion = updates.occasion;
    if (updates.letterMessage !== undefined) payload.letter_message = updates.letterMessage;
    if (updates.coverPhotoUrl !== undefined) payload.cover_photo_url = updates.coverPhotoUrl;
    if (updates.musicUrl !== undefined) payload.music_url = updates.musicUrl;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await supabase
      .from('surprises')
      .update(payload)
      .eq('id', surpriseId)
      .select('*, surprise_questions(*)')
      .single();

    if (error || !data) {
      console.error('[SurpriseService] Update error:', error?.message);
      throw new Error(error?.message || 'Failed to update surprise');
    }

    return {
      ...data,
      letter_message: data.letter_message || data.message || null,
      questions: (data.surprise_questions || []).sort(
        (a: SurpriseQuestion, b: SurpriseQuestion) => a.question_order - b.question_order
      ),
    };
  } catch (err: any) {
    console.error('[SurpriseService] Exception updating surprise:', err);
    throw err;
  }
}

/**
 * Save / replace all questions for a specific surprise
 */
export async function saveSurpriseQuestions(
  surpriseId: string,
  questions: Omit<SurpriseQuestion, 'id' | 'surprise_id'>[]
): Promise<SurpriseQuestion[]> {
  if (isPlaceholder) {
    const s = demoSurprises.find((item) => item.id === surpriseId);
    if (s) {
      s.questions = questions.map((q, idx) => ({
        id: `local-q-${idx}`,
        surprise_id: surpriseId,
        question_order: idx + 1,
        question_type: q.question_type || 'playful_choice',
        question_text: q.question_text,
        yes_text: q.yes_text || 'Yes ❤️',
        no_text: q.no_text || 'No 😂',
        no_button_behavior: q.no_button_behavior || 'escape',
        hint: q.hint || null,
        reveal_message: q.reveal_message || null,
      }));
      return s.questions;
    }
    return [];
  }

  try {
    // 1. Delete existing questions for this surprise
    const { error: delError } = await supabase
      .from('surprise_questions')
      .delete()
      .eq('surprise_id', surpriseId);

    if (delError) {
      console.warn('[SurpriseService] Clean existing questions notice:', delError.message);
    }

    // 2. Insert new questions
    if (questions.length === 0) return [];

    const rows = questions.map((q, idx) => ({
      surprise_id: surpriseId,
      question_order: idx + 1,
      question_type: q.question_type || 'playful_choice',
      question_text: q.question_text,
      yes_text: q.yes_text || 'Yes ❤️',
      no_text: q.no_text || 'No 😂',
      no_button_behavior: q.no_button_behavior || 'escape',
      hint: q.hint || null,
      reveal_message: q.reveal_message || null,
    }));

    const { data, error: insertError } = await supabase
      .from('surprise_questions')
      .insert(rows)
      .select();

    if (insertError) {
      console.error('[SurpriseService] Insert questions error:', insertError.message);
      throw new Error(insertError.message);
    }

    return (data as SurpriseQuestion[]).sort((a, b) => a.question_order - b.question_order);
  } catch (err: any) {
    console.error('[SurpriseService] Exception saving questions:', err);
    throw err;
  }
}

/**
 * Delete a surprise and all associated questions
 */
export async function deleteSurprise(surpriseId: string): Promise<boolean> {
  if (isPlaceholder) {
    const idx = demoSurprises.findIndex((s) => s.id === surpriseId);
    if (idx !== -1) {
      demoSurprises.splice(idx, 1);
      return true;
    }
    return false;
  }

  try {
    const { error } = await supabase.from('surprises').delete().eq('id', surpriseId);
    if (error) {
      console.error('[SurpriseService] Delete surprise error:', error.message);
      throw new Error(error.message);
    }
    return true;
  } catch (err) {
    console.error('[SurpriseService] Exception in deleteSurprise:', err);
    throw err;
  }
}

/**
 * Publish a surprise so the recipient can experience it
 */
export async function publishSurprise(surpriseId: string): Promise<Surprise> {
  return updateSurprise(surpriseId, { status: 'published' });
}

/**
 * Unpublish a surprise back to draft
 */
export async function unpublishSurprise(surpriseId: string): Promise<Surprise> {
  return updateSurprise(surpriseId, { status: 'draft' });
}

/**
 * Mark a surprise as viewed by the recipient
 */
export async function markSurpriseViewed(surpriseId: string): Promise<void> {
  if (isPlaceholder) return;
  try {
    await supabase
      .from('surprises')
      .update({ is_viewed: true, viewed_at: new Date().toISOString() })
      .eq('id', surpriseId);
  } catch (err) {
    console.error('[SurpriseService] markSurpriseViewed error:', err);
  }
}
