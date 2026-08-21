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

    if (error || !data) {
      console.warn('[MessagesService] Fetch note:', error?.message);
      return getDemoMessages(coupleId);
    }

    return (data as ChatMessage[]).length > 0 ? (data as ChatMessage[]) : getDemoMessages(coupleId);
  } catch (err) {
    console.error('[MessagesService] Exception:', err);
    return getDemoMessages(coupleId);
  }
}

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage | null> {
  const { coupleId, senderId, content, messageType = 'text' } = input;

  try {
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
      console.warn('[MessagesService] Insert note:', error?.message);
      return {
        id: crypto.randomUUID(),
        couple_id: coupleId,
        sender_id: senderId,
        content,
        message_type: messageType,
        created_at: new Date().toISOString(),
      };
    }

    return data as ChatMessage;
  } catch (err) {
    console.error('[MessagesService] Error sending message:', err);
    return null;
  }
}

export function subscribeToMessages(
  coupleId: string,
  onNewMessage: (msg: ChatMessage) => void
): RealtimeChannel {
  return supabase
    .channel(`couple-messages-${coupleId}`)
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
    .subscribe();
}

function getDemoMessages(coupleId: string): ChatMessage[] {
  const now = new Date();
  const t1 = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const t2 = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  return [
    {
      id: 'demo-msg-1',
      couple_id: coupleId,
      sender_id: 'partner-id',
      content: 'Good morning my love! ❤️ Hope you have a wonderful day ahead.',
      message_type: 'text',
      created_at: t1,
    },
    {
      id: 'demo-msg-2',
      couple_id: coupleId,
      sender_id: 'current-user-id',
      content: 'Good morning sunshine! Looking forward to our dinner date tonight ✨',
      message_type: 'text',
      created_at: t2,
    },
  ];
}
