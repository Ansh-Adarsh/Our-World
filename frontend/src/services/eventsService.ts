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

    if (error) {
      console.error('[EventsService] Fetch events error:', error.message);
      throw new Error(error.message);
    }

    return (data as CoupleEvent[]) || [];
  } catch (err) {
    console.error('[EventsService] Exception in fetchEvents:', err);
    throw err;
  }
}

export async function createEvent(input: CreateEventInput): Promise<CoupleEvent> {
  const { coupleId, userId, title, description, eventDate, category, isAnnual = false } = input;

  if (isPlaceholder) {
    return {
      id: crypto.randomUUID(),
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
    console.error('[EventsService] Create event failed:', error?.message);
    throw new Error(error?.message || 'Failed to create event');
  }

  return data as CoupleEvent;
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
  coupleId: string
): Promise<CoupleEvent> {
  const { title, description, eventDate, category, isAnnual = false } = input;

  if (isPlaceholder) {
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

  const { data, error } = await supabase
    .from('events')
    .update({
      title,
      description: description || null,
      event_date: eventDate,
      category,
      is_annual: isAnnual,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error || !data) {
    console.error('[EventsService] Update event failed:', error?.message);
    throw new Error(error?.message || 'Failed to update event');
  }

  return data as CoupleEvent;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  if (isPlaceholder) return true;

  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) {
    console.error('[EventsService] Delete DB error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

/**
 * Realtime subscription to events table changes
 */
export function subscribeToEvents(
  coupleId: string,
  onChange: () => void
) {
  return supabase
    .channel(`couple-events-${coupleId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `couple_id=eq.${coupleId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();
}

function getDemoEvents(coupleId: string): CoupleEvent[] {
  const today = new Date();
  const dateNight = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
  ];
}
