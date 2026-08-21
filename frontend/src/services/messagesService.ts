import { supabase, isPlaceholder } from './supabase';
import type { ChatMessage, MessageType } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SendMessageInput {
  coupleId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
}

export async function fetchMessages(coupleId: string): Promise<ChatMessage[]> {
  if (isPlaceholder) {
    return getDemoMessages(coupleId);
  }
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[MessagesService] Fetch messages error:', error.message);
      throw new Error(error.message);
    }

    return (data as ChatMessage[]) || [];
  } catch (err) {
    console.error('[MessagesService] Exception in fetchMessages:', err);
    throw err;
  }
}

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  const { coupleId, senderId, content, messageType = 'text' } = input;

  if (isPlaceholder) {
    return {
      id: crypto.randomUUID(),
      couple_id: coupleId,
      sender_id: senderId,
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      couple_id: coupleId,
      sender_id: senderId,
      content,
      message_type: messageType,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[MessagesService] Error sending message:', error?.message);
    throw new Error(error?.message || 'Failed to send message');
  }

  return data as ChatMessage;
}

/**
 * Mark incoming unread messages as read in Supabase
 */
export async function markMessagesAsRead(coupleId: string): Promise<void> {
  if (isPlaceholder || !coupleId) return;

  try {
    const { error } = await supabase.rpc('mark_messages_read', {
      target_couple_id: coupleId,
    });
    if (error) {
      // Fallback direct update
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session.session?.user.id;
      if (currentUserId) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('couple_id', coupleId)
          .neq('sender_id', currentUserId)
          .is('read_at', null);
      }
    }
  } catch (err) {
    console.warn('[MessagesService] markMessagesAsRead note:', err);
  }
}

/**
 * Get count of unread incoming messages
 */
export async function getUnreadMessageCount(
  coupleId: string,
  currentUserId: string
): Promise<number> {
  if (isPlaceholder || !coupleId || !currentUserId) return 0;

  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', coupleId)
      .neq('sender_id', currentUserId)
      .is('read_at', null);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Subscribe to realtime incoming messages and updates for the shared world
 */
export function subscribeToMessages(
  coupleId: string,
  onNewMessage: (msg: ChatMessage) => void,
  onUpdateMessage?: (msg: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase.channel(`couple-messages-${coupleId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `couple_id=eq.${coupleId}`,
      },
      (payload) => {
        if (payload.new) {
          onNewMessage(payload.new as ChatMessage);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `couple_id=eq.${coupleId}`,
      },
      (payload) => {
        if (payload.new && onUpdateMessage) {
          onUpdateMessage(payload.new as ChatMessage);
        }
      }
    );

  channel.subscribe();
  return channel;
}

/**
 * Realtime Presence tracking between the two partners
 */
export function subscribeToPresence(
  coupleId: string,
  user: { id: string; name: string },
  onPartnerStatusChange: (isPartnerOnline: boolean) => void
): RealtimeChannel {
  const channel = supabase.channel(`couple-presence-${coupleId}`, {
    config: {
      presence: {
        key: user.id,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const userIds = Object.keys(state);
      const partnerOnline = userIds.some((id) => id !== user.id);
      onPartnerStatusChange(partnerOnline);
    })
    .on('presence', { event: 'join' }, ({ key }) => {
      if (key !== user.id) {
        onPartnerStatusChange(true);
      }
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      if (key !== user.id) {
        onPartnerStatusChange(false);
      }
    });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        online_at: new Date().toISOString(),
        user_name: user.name,
      });
    }
  });

  return channel;
}

function getDemoMessages(coupleId: string): ChatMessage[] {
  const now = new Date();
  const t1 = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

  return [
    {
      id: 'demo-msg-1',
      couple_id: coupleId,
      sender_id: 'partner-id',
      content: 'Good morning my love! ❤️ Hope you have a wonderful day ahead.',
      message_type: 'text',
      created_at: t1,
      read_at: null,
    },
  ];
}
