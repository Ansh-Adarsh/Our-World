import { supabase, isPlaceholder } from './supabase';
import type { ChatMessage, MessageType } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SendMessageInput {
  coupleId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
}

function getLocalMessages(coupleId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`ourworld_chat_${coupleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(coupleId: string, list: ChatMessage[]) {
  try {
    localStorage.setItem(`ourworld_chat_${coupleId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('[MessagesService] LocalStorage save note:', e);
  }
}

export async function fetchMessages(coupleId: string): Promise<ChatMessage[]> {
  if (isPlaceholder || !coupleId) {
    return getLocalMessages(coupleId);
  }

  const localMsgs = getLocalMessages(coupleId);

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[MessagesService] Remote fetch notice, using local cache:', error.message);
      return localMsgs;
    }

    if (!data || data.length === 0) {
      return localMsgs;
    }

    const remoteMsgs = data as ChatMessage[];
    const mergedMap = new Map<string, ChatMessage>();
    localMsgs.forEach((m) => mergedMap.set(m.id, m));
    remoteMsgs.forEach((m) => mergedMap.set(m.id, m));

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    saveLocalMessages(coupleId, combined);
    return combined;
  } catch (err) {
    console.warn('[MessagesService] Fetch exception, returning local cache:', err);
    return localMsgs;
  }
}

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  const { coupleId, senderId, content, messageType = 'text' } = input;

  const localId = crypto.randomUUID();
  const localNewMsg: ChatMessage = {
    id: localId,
    couple_id: coupleId,
    sender_id: senderId,
    content,
    message_type: messageType,
    created_at: new Date().toISOString(),
  };

  if (isPlaceholder || !coupleId) {
    const existing = getLocalMessages(coupleId);
    saveLocalMessages(coupleId, [...existing, localNewMsg]);
    return localNewMsg;
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: localId,
        couple_id: coupleId,
        sender_id: senderId,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('[MessagesService] Remote insert notice, persisting locally:', error?.message);
      const existing = getLocalMessages(coupleId);
      saveLocalMessages(coupleId, [...existing, localNewMsg]);
      return localNewMsg;
    }

    const createdRecord = data as ChatMessage;
    const existing = getLocalMessages(coupleId);
    saveLocalMessages(coupleId, [...existing.filter((m) => m.id !== localId), createdRecord]);
    return createdRecord;
  } catch (err) {
    console.warn('[MessagesService] sendMessage exception, persisting locally:', err);
    const existing = getLocalMessages(coupleId);
    saveLocalMessages(coupleId, [...existing, localNewMsg]);
    return localNewMsg;
  }
}

export async function markMessagesAsRead(coupleId: string): Promise<void> {
  if (isPlaceholder || !coupleId) return;

  try {
    const { error } = await supabase.rpc('mark_messages_read', {
      target_couple_id: coupleId,
    });
    if (error) {
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

export async function getUnreadMessageCount(
  coupleId: string,
  currentUserId: string
): Promise<number> {
  if (isPlaceholder || !coupleId) {
    const localMsgs = getLocalMessages(coupleId);
    return localMsgs.filter((m) => m.sender_id !== currentUserId && !m.read_at).length;
  }

  try {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('couple_id', coupleId)
      .neq('sender_id', currentUserId)
      .is('read_at', null);

    if (error) {
      const localMsgs = getLocalMessages(coupleId);
      return localMsgs.filter((m) => m.sender_id !== currentUserId && !m.read_at).length;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}

export function subscribeToMessages(
  coupleId: string,
  onNewMessage: (message: ChatMessage) => void,
  onUpdateMessage?: (message: ChatMessage) => void
): RealtimeChannel | null {
  if (isPlaceholder || !coupleId) return null;

  return supabase
    .channel(`couple-chat-${coupleId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `couple_id=eq.${coupleId}`,
      },
      (payload) => {
        const newMsg = payload.new as ChatMessage;
        const existing = getLocalMessages(coupleId);
        saveLocalMessages(coupleId, [...existing.filter((m) => m.id !== newMsg.id), newMsg]);
        onNewMessage(newMsg);
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
        const updatedMsg = payload.new as ChatMessage;
        const existing = getLocalMessages(coupleId);
        saveLocalMessages(
          coupleId,
          existing.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );
        if (onUpdateMessage) onUpdateMessage(updatedMsg);
      }
    )
    .subscribe();
}

export function subscribeToPresence(
  coupleId: string,
  currentUser: { id: string; name?: string } | string,
  onPresenceChange: (isOnline: boolean) => void
): RealtimeChannel | null {
  if (isPlaceholder || !coupleId) return null;

  const currentUserId = typeof currentUser === 'string' ? currentUser : currentUser.id;
  const channel = supabase.channel(`presence-${coupleId}`, {
    config: { presence: { key: currentUserId } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const keys = Object.keys(state);
      const hasOther = keys.some((k) => k !== currentUserId);
      onPresenceChange(hasOther);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

  return channel;
}
