import { supabase, isPlaceholder } from './supabase';
import type { CoupleEvent, EventCategory } from '@/types';

export interface CreateEventInput {
  coupleId: string;
  userId: string;
  title: string;
  description?: string;
  eventDate: string;
  category: EventCategory;
  isAnnual?: boolean;
}

export interface UpdateEventInput {
  title: string;
  description?: string;
  eventDate: string;
  category: EventCategory;
  isAnnual?: boolean;
}

function getLocalEvents(coupleId: string): CoupleEvent[] {
  try {
    const raw = localStorage.getItem(`ourworld_events_${coupleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEvents(coupleId: string, list: CoupleEvent[]) {
  try {
    localStorage.setItem(`ourworld_events_${coupleId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('[EventsService] LocalStorage save note:', e);
  }
}

export async function fetchEvents(coupleId: string): Promise<CoupleEvent[]> {
  if (isPlaceholder || !coupleId) {
    return getLocalEvents(coupleId);
  }

  const localEvents = getLocalEvents(coupleId);

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .order('event_date', { ascending: true });

    if (error) {
      console.warn('[EventsService] Remote fetch notice, using local cache:', error.message);
      return localEvents;
    }

    if (!data || data.length === 0) {
      return localEvents;
    }

    const remoteEvents = data as CoupleEvent[];
    const mergedMap = new Map<string, CoupleEvent>();
    localEvents.forEach((e) => mergedMap.set(e.id, e));
    remoteEvents.forEach((e) => mergedMap.set(e.id, e));

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    saveLocalEvents(coupleId, combined);
    return combined;
  } catch (err) {
    console.warn('[EventsService] Fetch exception, returning local cache:', err);
    return localEvents;
  }
}

export async function createEvent(input: CreateEventInput): Promise<CoupleEvent> {
  const { coupleId, userId, title, description, eventDate, category, isAnnual = false } = input;

  const localId = crypto.randomUUID();
  const localNewEvent: CoupleEvent = {
    id: localId,
    couple_id: coupleId,
    author_id: userId,
    title,
    description: description || null,
    event_date: eventDate,
    category,
    is_annual: isAnnual,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isPlaceholder || !coupleId) {
    const existing = getLocalEvents(coupleId);
    saveLocalEvents(coupleId, [...existing, localNewEvent]);
    return localNewEvent;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        id: localId,
        couple_id: coupleId,
        author_id: userId,
        title,
        description: description || null,
        event_date: eventDate,
        category,
        is_annual: isAnnual,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('[EventsService] Remote insert notice, persisting locally:', error?.message);
      const existing = getLocalEvents(coupleId);
      saveLocalEvents(coupleId, [...existing, localNewEvent]);
      return localNewEvent;
    }

    const createdRecord = data as CoupleEvent;
    const existing = getLocalEvents(coupleId);
    saveLocalEvents(coupleId, [...existing.filter((e) => e.id !== localId), createdRecord]);
    return createdRecord;
  } catch (err) {
    console.warn('[EventsService] createEvent exception, persisting locally:', err);
    const existing = getLocalEvents(coupleId);
    saveLocalEvents(coupleId, [...existing, localNewEvent]);
    return localNewEvent;
  }
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
  coupleId?: string
): Promise<CoupleEvent> {
  const { title, description, eventDate, category, isAnnual = false } = input;

  const targetCoupleId = coupleId || 'default-couple';
  const existing = getLocalEvents(targetCoupleId);
  const updatedLocal: CoupleEvent = {
    id: eventId,
    couple_id: targetCoupleId,
    author_id: 'user',
    title,
    description: description || null,
    event_date: eventDate,
    category,
    is_annual: isAnnual,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalEvents(
    targetCoupleId,
    existing.map((e) => (e.id === eventId ? { ...e, ...updatedLocal } : e))
  );

  if (isPlaceholder || !coupleId) {
    return updatedLocal;
  }

  try {
    await supabase
      .from('events')
      .update({
        title,
        description: description || null,
        event_date: eventDate,
        category,
        is_annual: isAnnual,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    return updatedLocal;
  } catch (err) {
    console.warn('[EventsService] updateEvent notice:', err);
    return updatedLocal;
  }
}

export async function deleteEvent(eventId: string, coupleId?: string): Promise<boolean> {
  if (coupleId) {
    const existing = getLocalEvents(coupleId);
    saveLocalEvents(
      coupleId,
      existing.filter((e) => e.id !== eventId)
    );
  }

  if (isPlaceholder || !coupleId) {
    return true;
  }

  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      console.warn('[EventsService] Remote delete notice:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('[EventsService] deleteEvent exception:', err);
    return true;
  }
}

export function subscribeToEvents(coupleId: string, onUpdate: () => void) {
  if (isPlaceholder || !coupleId) return null;

  return supabase
    .channel(`couple-events-${coupleId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `couple_id=eq.${coupleId}` },
      () => onUpdate()
    )
    .subscribe();
}
