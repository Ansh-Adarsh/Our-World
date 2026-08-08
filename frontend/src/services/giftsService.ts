import { supabase } from './supabase';
import type { GiftItem } from '@/types';

export interface CreateGiftInput {
  coupleId: string;
  addedById: string;
  title: string;
  description?: string;
  priceEstimate?: string;
  linkUrl?: string;
}

export async function fetchGifts(coupleId: string): Promise<GiftItem[]> {
  try {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[GiftsService] Fetch note:', error?.message);
      return getDemoGifts(coupleId);
    }

    return (data as GiftItem[]).length > 0 ? (data as GiftItem[]) : getDemoGifts(coupleId);
  } catch (err) {
    console.error('[GiftsService] Exception:', err);
    return getDemoGifts(coupleId);
  }
}

export async function addGift(input: CreateGiftInput): Promise<GiftItem | null> {
  const { coupleId, addedById, title, description, priceEstimate, linkUrl } = input;

  try {
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
      console.warn('[GiftsService] Insert note:', error?.message);
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

    return data as GiftItem;
  } catch (err) {
    console.error('[GiftsService] Error adding gift:', err);
    return null;
  }
}

export async function toggleGiftGivenStatus(giftId: string, isGiven: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('gifts')
      .update({
        is_given: isGiven,
        given_at: isGiven ? new Date().toISOString() : null,
      })
      .eq('id', giftId);

    if (error) {
      console.warn('[GiftsService] Toggle status error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[GiftsService] Toggle status exception:', err);
    return false;
  }
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
    {
      id: 'demo-gift-2',
      couple_id: coupleId,
      added_by_id: 'demo-user',
      title: 'Handcrafted Memory Scrapbook',
      description: 'Filled with our concert tickets and letters',
      price_estimate: '$35',
      link_url: null,
      is_given: true,
      given_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
}
