import { supabase, isPlaceholder } from './supabase';
import type { UnderstandingEntry, UnderstandingStatus } from '@/types';

export interface CreateUnderstandingInput {
  coupleId: string;
  userId: string;
  topic: string;
  myPerspective: string;
  partnerPerspectiveSummary?: string;
  proposedResolution?: string;
}

export async function fetchUnderstandingEntries(coupleId: string): Promise<UnderstandingEntry[]> {
  if (isPlaceholder) {
    return getDemoUnderstandingEntries(coupleId);
  }
  try {
    const { data, error } = await supabase
      .from('understanding_entries')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[UnderstandingService] Fetch note:', error?.message);
      return getDemoUnderstandingEntries(coupleId);
    }

    return (data as UnderstandingEntry[]).length > 0
      ? (data as UnderstandingEntry[])
      : getDemoUnderstandingEntries(coupleId);
  } catch (err) {
    console.error('[UnderstandingService] Exception:', err);
    return getDemoUnderstandingEntries(coupleId);
  }
}

export async function createUnderstandingEntry(
  input: CreateUnderstandingInput
): Promise<UnderstandingEntry | null> {
  const { coupleId, userId, topic, myPerspective, partnerPerspectiveSummary, proposedResolution } = input;

  try {
    const { data, error } = await supabase
      .from('understanding_entries')
      .insert({
        couple_id: coupleId,
        author_id: userId,
        topic,
        my_perspective: myPerspective,
        partner_perspective_summary: partnerPerspectiveSummary || null,
        proposed_resolution: proposedResolution || null,
        status: 'open',
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('[UnderstandingService] Insert note:', error?.message);
      return {
        id: crypto.randomUUID(),
        couple_id: coupleId,
        author_id: userId,
        topic,
        my_perspective: myPerspective,
        partner_perspective_summary: partnerPerspectiveSummary || null,
        proposed_resolution: proposedResolution || null,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data as UnderstandingEntry;
  } catch (err) {
    console.error('[UnderstandingService] Error creating entry:', err);
    return null;
  }
}

export async function updateUnderstandingStatus(
  id: string,
  status: UnderstandingStatus,
  proposedResolution?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = { status };
    if (proposedResolution !== undefined) {
      updateData.proposed_resolution = proposedResolution;
    }

    const { error } = await supabase
      .from('understanding_entries')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.warn('[UnderstandingService] Status update note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[UnderstandingService] Status update exception:', err);
    return false;
  }
}

function getDemoUnderstandingEntries(coupleId: string): UnderstandingEntry[] {
  return [
    {
      id: 'demo-und-1',
      couple_id: coupleId,
      author_id: 'demo-user',
      topic: 'Balancing busy work schedules & quality evening time',
      my_perspective:
        'When work gets intense, I feel overwhelmed and sometimes need 20 minutes of quiet before starting our evening together.',
      partner_perspective_summary:
        'My partner feels excited to share their day as soon as we meet, so my silence can feel like distance.',
      proposed_resolution:
        'We agreed to have a 15-minute "reset pause" when getting home, followed by dedicated screen-free dinner time together.',
      status: 'resolved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
