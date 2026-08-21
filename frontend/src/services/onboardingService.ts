import { supabase } from './supabase';
import type { OnboardingAnswer, OnboardingStatus } from '@/types';

export interface SaveOnboardingInput {
  coupleId: string;
  userId: string;
  displayName?: string;
  coupleName?: string;
  anniversaryDate?: string;
  partnerName?: string;
  partnerBirthday?: string;
  answers: Record<string, string>;
}

export async function saveOnboardingData(input: SaveOnboardingInput): Promise<boolean> {
  const { coupleId, userId, displayName, coupleName, anniversaryDate, partnerName, partnerBirthday, answers } = input;

  try {
    // 1. Update user profile display_name if provided
    if (displayName && displayName.trim()) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        console.warn('[OnboardingService] Note on updating profile display_name:', profileError.message);
      }
    }

    // 2. Update couple record
    // Only fields that were actually supplied are written
    const coupleUpdate: Record<string, string | boolean | null> = { onboarding_completed: true };
    if (coupleName !== undefined) coupleUpdate.couple_name = coupleName || null;
    if (anniversaryDate !== undefined) coupleUpdate.anniversary_date = anniversaryDate || null;
    if (partnerName !== undefined) coupleUpdate.partner_name = partnerName || null;
    if (partnerBirthday !== undefined) coupleUpdate.partner_birthday = partnerBirthday || null;

    const { error: coupleError } = await supabase
      .from('couples')
      .update(coupleUpdate)
      .eq('id', coupleId);

    if (coupleError) {
      console.error('[OnboardingService] Error updating couples table:', coupleError.message);
      return false;
    }

    // 2. Insert onboarding answers
    const answersToInsert = Object.entries(answers).map(([key, value]) => ({
      couple_id: coupleId,
      user_id: userId,
      question_key: key,
      answer_text: value,
    }));

    if (answersToInsert.length > 0) {
      const { error: answersError } = await supabase
        .from('onboarding_answers')
        .upsert(answersToInsert, { onConflict: 'couple_id,user_id,question_key' });

      if (answersError) {
        console.error('[OnboardingService] Error saving answers:', answersError.message);
      }
    }

    return true;
  } catch (err) {
    console.error('[OnboardingService] Error saving onboarding:', err);
    return false;
  }
}

export async function fetchOnboardingAnswers(coupleId: string): Promise<OnboardingAnswer[]> {
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('*')
    .eq('couple_id', coupleId);

  if (error) {
    console.error('[OnboardingService] Error fetching answers:', error.message);
    return [];
  }

  return data as OnboardingAnswer[];
}

/** Read a single stored answer — used to weave the couple's own words into the
 *  birthday letter. Returns null when absent, never a placeholder. */
export async function fetchOnboardingAnswer(
  coupleId: string,
  questionKey: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('answer_text')
    .eq('couple_id', coupleId)
    .eq('question_key', questionKey)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return (data.answer_text as string) || null;
}

// ─── Journey state ────────────────────────────────────────────────────────────
// The journey's progress lives in `profiles` (migration 005), so it survives
// refreshes, new tabs and new devices — and so an existing user is never pushed
// back into onboarding.
//
// NOTE ON THE FALLBACK PATTERN: unlike the feature services in this folder,
// these functions do NOT fabricate success. They return a boolean so the caller
// knows whether the step was really persisted. The journey pages advance the
// in-memory store either way (so the experience is never a dead end when the
// database is unreachable), but nothing here pretends a write happened.

export interface JourneyState {
  status: OnboardingStatus;
  step: number;
}

/**
 * Coerce a raw profile row into journey state.
 *
 * This is the only place journey state is interpreted — the store already reads
 * the whole `profiles` row when hydrating a session, so there is deliberately no
 * second fetch for the same two columns.
 *
 * Returns null when there is no row at all; the caller treats that as "returning
 * user" and sends them to the dashboard. Failing open is deliberate: a database
 * hiccup must never trap someone in onboarding.
 *
 * A row *without* `onboarding_status` means migration 005 has not been applied
 * yet, so the user predates the journey → 'completed'.
 */
export function normalizeJourneyState(profileRow: {
  onboarding_status?: string | null;
  onboarding_step?: number | null;
} | null): JourneyState | null {
  if (!profileRow) return null;

  const raw = profileRow.onboarding_status;
  if (!raw) return { status: 'completed', step: 0 };

  const valid: OnboardingStatus[] = [
    'not_started',
    'questions_completed',
    'birthday_completed',
    'memories_completed',
    'completed',
  ];

  const status = valid.includes(raw as OnboardingStatus) ? (raw as OnboardingStatus) : 'completed';
  const step = Math.max(0, profileRow.onboarding_step ?? 0);

  return { status, step };
}

/** Persist a journey transition. Returns false if the write did not land. */
export async function persistJourneyStatus(
  userId: string,
  status: OnboardingStatus,
): Promise<boolean> {
  const patch: Record<string, string | number | null> = { onboarding_status: status };

  // Stamp the finish line, and reset the resume pointer once the game is done.
  if (status === 'completed') patch.onboarding_completed_at = new Date().toISOString();
  if (status !== 'not_started') patch.onboarding_step = 0;

  try {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) {
      console.warn(`[OnboardingService] Journey status → ${status} not persisted:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[OnboardingService] Journey status write exception:', err);
    return false;
  }
}

/** Persist the resume point inside the question game. */
export async function persistJourneyStep(userId: string, step: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_step: Math.max(0, step) })
      .eq('id', userId);

    if (error) {
      console.warn('[OnboardingService] Journey step not persisted:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[OnboardingService] Journey step write exception:', err);
    return false;
  }
}

/** Upsert one answer as the user goes, so progress is never lost on refresh. */
export async function saveJourneyAnswer(
  coupleId: string,
  userId: string,
  questionKey: string,
  answerText: string,
): Promise<boolean> {
  if (!answerText.trim()) return true;

  try {
    const { error } = await supabase
      .from('onboarding_answers')
      .upsert(
        { couple_id: coupleId, user_id: userId, question_key: questionKey, answer_text: answerText },
        { onConflict: 'couple_id,user_id,question_key' },
      );

    if (error) {
      console.warn(`[OnboardingService] Answer "${questionKey}" not persisted:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[OnboardingService] Answer write exception:', err);
    return false;
  }
}
