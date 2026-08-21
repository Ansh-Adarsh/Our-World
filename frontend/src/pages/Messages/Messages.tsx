import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Heart,
  ShieldCheck,
  Bot,
  Wifi,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  subscribeToPresence,
  markMessagesAsRead,
} from '@/services/messagesService';
import { generateAIContent } from '@/services/aiService';
import { HumanApprovalModal } from '@/components/ui/HumanApprovalModal';
import { PageContainer } from '@/components/ui/PageContainer';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import type { ChatMessage } from '@/types';

export function Messages() {
  const { user, couple } = useAuthStore();
  const { showToast } = useToastStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);

  // AI Love Letter state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiDraft, setAIDraft] = useState<{ content: string; agent: string } | null>(null);

  // Love heart animation trigger
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const coupleId = couple?.id;
  const partnerDisplayName = couple?.partner_name || 'My Love';

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!user || !coupleId) {
      setIsLoading(false);
      return;
    }
    let messageChannel: ReturnType<typeof subscribeToMessages> | null = null;
    let presenceChannel: ReturnType<typeof subscribeToPresence> | null = null;

    async function loadData() {
      if (!coupleId || !user) return;
      setIsLoading(true);
      try {
        const history = await fetchMessages(coupleId);
        setMessages(history);
      } catch (err) {
        console.error('[Messages] Load error:', err);
      } finally {
        setIsLoading(false);
      }
      setTimeout(() => scrollToBottom('auto'), 100);

      // Mark unread messages as read
      await markMessagesAsRead(coupleId);

      // Subscribe to Realtime messages (INSERT & UPDATE for read receipts)
      messageChannel = subscribeToMessages(
        coupleId,
        (newMsg) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => scrollToBottom('smooth'), 100);

          // If message is from partner, mark as read
          if (newMsg.sender_id !== user?.id) {
            markMessagesAsRead(coupleId);
            // Trigger romantic floating heart effect if heart message
            if (newMsg.message_type === 'heart') {
              triggerFloatingHeart();
            }
          }
        },
        (updatedMsg) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      );

      // Subscribe to Realtime presence
      presenceChannel = subscribeToPresence(
        coupleId,
        { id: user.id, name: user.profile?.display_name || user.email?.split('@')[0] || 'Partner' },
        (isOnline) => {
          setIsPartnerOnline(isOnline);
        }
      );
    }

    loadData();

    return () => {
      if (messageChannel) messageChannel.unsubscribe();
      if (presenceChannel) presenceChannel.unsubscribe();
    };
  }, [coupleId, user]);

  const triggerFloatingHeart = () => {
    const id = crypto.randomUUID();
    const x = Math.random() * 80 + 10;
    setFloatingHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const content = (customText || textInput).trim();
    if (!content || !user || !coupleId) return;

    setIsSending(true);
    const messageType = customText === '❤️' ? 'heart' : 'text';

    if (messageType === 'heart') {
      triggerFloatingHeart();
    }

    // Optimistic local add
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      couple_id: coupleId,
      sender_id: user.id,
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTextInput('');
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const sent = await sendMessage({
        coupleId,
        senderId: user.id,
        content,
        messageType,
      });

      if (sent) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? sent : m))
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Could not send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageContainer noBottomPad className="flex flex-col min-h-[calc(100dvh-5.5rem)] justify-between relative overflow-hidden">
      {/* Floating hearts animation */}
      <AnimatePresence>
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -250, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            style={{ left: `${heart.x}%` }}
            className="pointer-events-none fixed bottom-28 z-50 text-3xl"
          >
            💖
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-[#E8C97A]/10 blur-3xl" />
      </div>

      {/* Long-Distance Relationship Header Banner */}
      <div className="pb-4 border-b border-white/10 relative z-10 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#241B20]/60 backdrop-blur-md -mx-4 px-4 pt-1 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#B83B5E] to-[#E8C97A] p-0.5 shadow-lg">
              <div className="w-full h-full rounded-[14px] bg-[#241B20] flex items-center justify-center text-[#F4B8C9] font-serif text-lg font-bold">
                {partnerDisplayName.charAt(0)}
              </div>
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#241B20] ${
                isPartnerOnline ? 'bg-emerald-400' : 'bg-white/30'
              }`}
              title={isPartnerOnline ? 'Online now' : 'Offline'}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-light text-[#FFFCF9]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {partnerDisplayName}
              </h1>
              <span className="text-xs text-[#E8C97A] font-sans">❤️</span>
            </div>

            <p className="text-[11px] text-[#9C8490] font-sans flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[#F4B8C9]">
                <ShieldCheck size={12} />
                <span>Private World Chat</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi size={11} />
                <span>Realtime Active</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => handleSend(undefined, '❤️')}
            className="px-3.5 py-1.5 rounded-full bg-[#B83B5E]/25 border border-[#B83B5E]/40 text-[#F4B8C9] text-xs font-sans hover:bg-[#B83B5E]/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Heart size={14} className="fill-[#F4B8C9] text-[#F4B8C9]" />
            <span>Send Love</span>
          </button>

          <button
            type="button"
            disabled={isAILoading}
            onClick={async () => {
              setIsAILoading(true);
              const result = await generateAIContent({
                intent: 'love_letter',
                context: { partner_name: partnerDisplayName, topic: 'long distance love and thinking of you' },
              });
              setAIDraft({ content: result.draft_content, agent: result.agent_name });
              setIsAILoading(false);
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#E8C97A]/15 border border-[#E8C97A]/30 text-[#E8C97A] text-xs font-sans hover:bg-[#E8C97A]/25 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Bot size={13} />
            <span>{isAILoading ? 'Drafting...' : 'AI Letter 💌'}</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-3.5 relative z-10 my-2 no-scrollbar">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Opening your private connection...
          </div>
        ) : messages.length === 0 ? (
          <div className="glass-card p-10 text-center max-w-sm mx-auto my-12 border border-[#F4B8C9]/20 rounded-3xl bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <FlowerAccent variant="sakura" size={44} color="#F4B8C9" opacity={0.7} className="mx-auto mb-3" />
            <h3
              className="text-2xl text-[#FFFCF9] font-serif mb-1.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Miles apart, but never really apart. 💕
            </h3>
            <p className="text-xs text-[#9C8490] font-sans mb-5 leading-relaxed">
              This is your private digital room. Write the first message to your love.
            </p>
            <button
              type="button"
              onClick={() => handleSend(undefined, 'Good morning my love! ❤️ Thinking of you.')}
              className="px-4 py-2 rounded-xl bg-[#B83B5E] text-white text-xs font-sans hover:bg-[#922B48] transition-colors cursor-pointer"
            >
              "Good morning my love! ❤️"
            </button>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user ? msg.sender_id === user.id : false;
            const isHeartOnly = msg.content === '❤️' || msg.message_type === 'heart';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {isHeartOnly ? (
                  <div className="text-4xl py-1 animate-bounce">
                    ❤️
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl text-sm font-sans leading-relaxed shadow-lg ${
                      isMe
                        ? 'bg-gradient-to-r from-[#B83B5E] to-[#8C2341] text-[#FFFCF9] rounded-br-sm border border-[#F4B8C9]/30'
                        : 'glass-card bg-[#2E2028]/95 text-[#FFF8F2] rounded-bl-sm border border-white/10'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}

                {/* Timestamp & Delivery Receipt */}
                <div className="flex items-center gap-1 text-[10px] text-[#9C8490] mt-1 px-1.5">
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {isMe && (
                    <span className="text-[#F4B8C9] ml-0.5 inline-flex items-center">
                      {msg.read_at ? (
                        <span title="Read">
                          <CheckCheck size={13} className="text-emerald-400 inline" />
                        </span>
                      ) : (
                        <span title="Delivered">
                          <Check size={13} className="inline opacity-70" />
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <form onSubmit={handleSend} className="relative z-10 shrink-0 pt-2 pb-20 sm:pb-6">
        <div className="glass-card p-2 rounded-2xl border border-white/15 bg-[#241B20]/95 flex items-center gap-2 shadow-2xl">
          <input
            type="text"
            placeholder="Write something to your love..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-[#FFFCF9] focus:outline-none placeholder-[#9C8490]/50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isSending}
            className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#B83B5E] to-[#E8C97A] text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-lg shadow-[#B83B5E]/30 hover:scale-105"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* Human Approval Modal for AI letter */}
      <HumanApprovalModal
        isOpen={!!aiDraft}
        agentName={aiDraft?.agent ?? ''}
        intent="love_letter"
        draftContent={aiDraft?.content ?? ''}
        onApprove={(approved) => {
          setTextInput(approved);
          setAIDraft(null);
        }}
        onReject={() => setAIDraft(null)}
      />
    </PageContainer>
  );
}
