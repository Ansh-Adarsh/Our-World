import { supabase } from './supabase';
import type { OnboardingAnswer } from '@/types';

export interface SaveOnboardingInput {
  coupleId: string;
  userId: string;
  coupleName?: string;
  anniversaryDate?: string;
  partnerName?: string;
  partnerBirthday?: string;
  answers: Record<string, string>;
}

export async function saveOnboardingData(input: SaveOnboardingInput): Promise<boolean> {
  const { coupleId, userId, coupleName, anniversaryDate, partnerName, partnerBirthday, answers } = input;

  try {
    // 1. Update couple record
    const { error: coupleError } = await supabase
      .from('couples')
      .update({
        couple_name: coupleName || null,
        anniversary_date: anniversaryDate || null,
        partner_name: partnerName || null,
        partner_birthday: partnerBirthday || null,
        onboarding_completed: true,
      })
      .eq('id', coupleId);

    if (coupleError) {
      console.warn('[OnboardingService] Note updating couples table:', coupleError.message);
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
        console.warn('[OnboardingService] Note saving answers:', answersError.message);
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
