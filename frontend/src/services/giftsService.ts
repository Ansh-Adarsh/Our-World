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

function getLocalGifts(coupleId: string): GiftItem[] {
  try {
    const raw = localStorage.getItem(`ourworld_gifts_${coupleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalGifts(coupleId: string, list: GiftItem[]) {
  try {
    localStorage.setItem(`ourworld_gifts_${coupleId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('[GiftsService] LocalStorage save note:', e);
  }
}

export async function fetchGifts(coupleId: string): Promise<GiftItem[]> {
  if (isPlaceholder || !coupleId) {
    return getLocalGifts(coupleId);
  }

  const localGifts = getLocalGifts(coupleId);

  try {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[GiftsService] Remote fetch notice, using local cache:', error.message);
      return localGifts;
    }

    if (!data || data.length === 0) {
      return localGifts;
    }

    const remoteGifts = data as GiftItem[];
    const mergedMap = new Map<string, GiftItem>();
    localGifts.forEach((g) => mergedMap.set(g.id, g));
    remoteGifts.forEach((g) => mergedMap.set(g.id, g));

    const combined = Array.from(mergedMap.values());
    saveLocalGifts(coupleId, combined);
    return combined;
  } catch (err) {
    console.warn('[GiftsService] Fetch exception, returning local cache:', err);
    return localGifts;
  }
}

export async function addGift(input: CreateGiftInput): Promise<GiftItem> {
  const { coupleId, addedById, title, description, priceEstimate, linkUrl } = input;

  const localId = crypto.randomUUID();
  const localNewGift: GiftItem = {
    id: localId,
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

  if (isPlaceholder || !coupleId) {
    const existing = getLocalGifts(coupleId);
    saveLocalGifts(coupleId, [localNewGift, ...existing]);
    return localNewGift;
  }

  try {
    const { data, error } = await supabase
      .from('gifts')
      .insert({
        id: localId,
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
      console.warn('[GiftsService] Remote insert notice, persisting locally:', error?.message);
      const existing = getLocalGifts(coupleId);
      saveLocalGifts(coupleId, [localNewGift, ...existing]);
      return localNewGift;
    }

    const createdRecord = data as GiftItem;
    const existing = getLocalGifts(coupleId);
    saveLocalGifts(coupleId, [createdRecord, ...existing.filter((g) => g.id !== localId)]);
    return createdRecord;
  } catch (err) {
    console.warn('[GiftsService] addGift exception, persisting locally:', err);
    const existing = getLocalGifts(coupleId);
    saveLocalGifts(coupleId, [localNewGift, ...existing]);
    return localNewGift;
  }
}

export async function updateGift(giftId: string, input: UpdateGiftInput, coupleId?: string): Promise<GiftItem> {
  const { title, description, priceEstimate, linkUrl, isGiven } = input;
  const targetCoupleId = coupleId || 'default-couple';

  const existing = getLocalGifts(targetCoupleId);
  const updatedLocal: GiftItem = {
    id: giftId,
    couple_id: targetCoupleId,
    added_by_id: 'user',
    title,
    description: description || null,
    price_estimate: priceEstimate || null,
    link_url: linkUrl || null,
    is_given: isGiven || false,
    given_at: isGiven ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
  };

  saveLocalGifts(
    targetCoupleId,
    existing.map((g) => (g.id === giftId ? { ...g, ...updatedLocal } : g))
  );

  if (isPlaceholder || !coupleId) {
    return updatedLocal;
  }

  try {
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

    await supabase.from('gifts').update(updatePayload).eq('id', giftId);
    return updatedLocal;
  } catch (err) {
    console.warn('[GiftsService] updateGift notice:', err);
    return updatedLocal;
  }
}

export async function toggleGiftGivenStatus(giftId: string, isGiven: boolean, coupleId?: string): Promise<boolean> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ourworld_gifts_')) {
      try {
        const list: GiftItem[] = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = list.map((g) =>
          g.id === giftId
            ? { ...g, is_given: isGiven, given_at: isGiven ? new Date().toISOString() : null }
            : g
        );
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    }
  }

  if (isPlaceholder || !coupleId) return true;

  try {
    await supabase
      .from('gifts')
      .update({
        is_given: isGiven,
        given_at: isGiven ? new Date().toISOString() : null,
      })
      .eq('id', giftId);
    return true;
  } catch {
    return true;
  }
}

export async function deleteGift(giftId: string, _coupleId?: string): Promise<boolean> {
  // Remove from all local sanctuary storage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ourworld_gifts_')) {
      try {
        const list: GiftItem[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((g) => g.id !== giftId);
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch {}
    }
  }

  if (isPlaceholder) return true;

  try {
    const { error } = await supabase.from('gifts').delete().eq('id', giftId);
    if (error) {
      console.warn('[GiftsService] Delete gift error:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('[GiftsService] deleteGift exception:', err);
    return true;
  }
}
