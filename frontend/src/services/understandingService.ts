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

    if (error) {
      console.error('[UnderstandingService] Fetch error:', error.message);
      throw new Error(error.message);
    }

    if (!data) return [];

    return data as UnderstandingEntry[];
  } catch (err) {
    console.error('[UnderstandingService] Exception in fetchUnderstandingEntries:', err);
    throw err;
  }
}

export async function createUnderstandingEntry(
  input: CreateUnderstandingInput
): Promise<UnderstandingEntry> {
  const { coupleId, userId, topic, myPerspective, partnerPerspectiveSummary, proposedResolution } = input;

  if (isPlaceholder) {
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
    console.error('[UnderstandingService] Insert entry failed:', error?.message);
    throw new Error(error?.message || 'Failed to create understanding entry');
  }

  return data as UnderstandingEntry;
}

export async function updateUnderstandingStatus(
  id: string,
  status: UnderstandingStatus,
  proposedResolution?: string
): Promise<boolean> {
  if (isPlaceholder) return true;

  const updateData: Record<string, unknown> = { status };
  if (proposedResolution !== undefined) {
    updateData.proposed_resolution = proposedResolution;
  }

  const { error } = await supabase
    .from('understanding_entries')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('[UnderstandingService] Status update error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteUnderstandingEntry(id: string): Promise<boolean> {
  if (isPlaceholder) return true;

  const { error } = await supabase
    .from('understanding_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[UnderstandingService] Delete entry error:', error.message);
    throw new Error(error.message);
  }
  return true;
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
