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

export async function fetchEvents(coupleId: string): Promise<CoupleEvent[]> {
  if (isPlaceholder) {
    return getDemoEvents(coupleId);
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .order('event_date', { ascending: true });

    if (error || !data) {
      console.warn('[EventsService] Fetch note:', error?.message);
      return getDemoEvents(coupleId);
    }

    return (data as CoupleEvent[]).length > 0 ? (data as CoupleEvent[]) : getDemoEvents(coupleId);
  } catch (err) {
    console.error('[EventsService] Exception:', err);
    return getDemoEvents(coupleId);
  }
}

export async function createEvent(input: CreateEventInput): Promise<CoupleEvent | null> {
  const { coupleId, userId, title, description, eventDate, category, isAnnual = false } = input;

  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
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
      console.warn('[EventsService] Insert note:', error?.message);
      const localId = crypto.randomUUID();
      return {
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
    }

    return data as CoupleEvent;
  } catch (err) {
    console.error('[EventsService] Error creating event:', err);
    return null;
  }
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
  coupleId: string
): Promise<CoupleEvent | null> {
  const { title, description, eventDate, category, isAnnual = false } = input;

  try {
    const { data, error } = await supabase
      .from('events')
      .update({
        title,
        description: description || null,
        event_date: eventDate,
        category,
        is_annual: isAnnual,
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error || !data) {
      console.warn('[EventsService] Update note:', error?.message);
      return {
        id: eventId,
        couple_id: coupleId,
        author_id: 'current-user',
        title,
        description: description || null,
        event_date: eventDate,
        category,
        is_annual: isAnnual,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data as CoupleEvent;
  } catch (err) {
    console.error('[EventsService] Error updating event:', err);
    return null;
  }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      console.warn('[EventsService] Delete DB note:', error.message);
    }
    return true;
  } catch (err) {
    console.error('[EventsService] Error deleting event:', err);
    return false;
  }
}

function getDemoEvents(coupleId: string): CoupleEvent[] {
  const today = new Date();
  const dateNight = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weekendTrip = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      id: 'demo-event-1',
      couple_id: coupleId,
      author_id: 'demo-user',
      title: 'Romantic Candlelight Dinner Date',
      description: 'Reservation at La Petite Maison at 7:30 PM',
      event_date: dateNight,
      category: 'date_night',
      is_annual: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-event-2',
      couple_id: coupleId,
      author_id: 'demo-user',
      title: 'Monsoon Mountain Getaway Trip',
      description: 'Weekend cabin stay by the lake',
      event_date: weekendTrip,
      category: 'trip',
      is_annual: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
