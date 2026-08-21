import { supabase, isPlaceholder } from './supabase';
import type { GiftItem } from '@/types';

export interface CreateGiftInput {
  coupleId: string;
  addedById: string;
  title: string;
  description?: string;
  priceEstimate?: string;
  linkUrl?: string;
}

export interface UpdateGiftInput {
  title: string;
  description?: string;
  priceEstimate?: string;
  linkUrl?: string;
  isGiven?: boolean;
}

export async function fetchGifts(coupleId: string): Promise<GiftItem[]> {
  if (isPlaceholder) {
    return getDemoGifts(coupleId);
  }
  try {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GiftsService] Fetch gifts error:', error.message);
      throw new Error(error.message);
    }

    return (data as GiftItem[]) || [];
  } catch (err) {
    console.error('[GiftsService] Exception in fetchGifts:', err);
    throw err;
  }
}

export async function addGift(input: CreateGiftInput): Promise<GiftItem> {
  const { coupleId, addedById, title, description, priceEstimate, linkUrl } = input;

  if (isPlaceholder) {
    return {
      id: crypto.randomUUID(),
      couple_id: coupleId,
      added_by_id: addedById,
      title,
      description: description || null,
      price_estimate: priceEstimate || null,
      link_url: linkUrl || null,
      is_given: false,
      given_at: null,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('gifts')
    .insert({
      couple_id: coupleId,
      added_by_id: addedById,
      title,
      description: description || null,
      price_estimate: priceEstimate || null,
      link_url: linkUrl || null,
      is_given: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[GiftsService] Insert gift failed:', error?.message);
    throw new Error(error?.message || 'Failed to add gift');
  }

  return data as GiftItem;
}

export async function updateGift(giftId: string, input: UpdateGiftInput): Promise<GiftItem> {
  const { title, description, priceEstimate, linkUrl, isGiven } = input;

  if (isPlaceholder) {
    return {
      id: giftId,
      couple_id: 'mock-couple-id',
      added_by_id: 'mock-user-id',
      title,
      description: description || null,
      price_estimate: priceEstimate || null,
      link_url: linkUrl || null,
      is_given: isGiven || false,
      given_at: isGiven ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    };
  }

  const updatePayload: Record<string, unknown> = {
    title,
    description: description || null,
    price_estimate: priceEstimate || null,
    link_url: linkUrl || null,
  };

  if (isGiven !== undefined) {
    updatePayload.is_given = isGiven;
    updatePayload.given_at = isGiven ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from('gifts')
    .update(updatePayload)
    .eq('id', giftId)
    .select()
    .single();

  if (error || !data) {
    console.error('[GiftsService] Update gift error:', error?.message);
    throw new Error(error?.message || 'Failed to update gift');
  }

  return data as GiftItem;
}

export async function toggleGiftGivenStatus(giftId: string, isGiven: boolean): Promise<boolean> {
  if (isPlaceholder) return true;

  const { error } = await supabase
    .from('gifts')
    .update({
      is_given: isGiven,
      given_at: isGiven ? new Date().toISOString() : null,
    })
    .eq('id', giftId);

  if (error) {
    console.error('[GiftsService] Toggle status error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteGift(giftId: string): Promise<boolean> {
  if (isPlaceholder) return true;

  const { error } = await supabase
    .from('gifts')
    .delete()
    .eq('id', giftId);

  if (error) {
    console.error('[GiftsService] Delete gift error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

function getDemoGifts(coupleId: string): GiftItem[] {
  return [
    {
      id: 'demo-gift-1',
      couple_id: coupleId,
      added_by_id: 'demo-user',
      title: 'Vintage Instant Camera (Rose Gold)',
      description: 'To capture printed physical memories of our weekend trips',
      price_estimate: '$85',
      link_url: 'https://example.com/camera',
      is_given: false,
      given_at: null,
      created_at: new Date().toISOString(),
    },
  ];
}
