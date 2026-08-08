import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, MessageCircle, ShieldCheck, Bot } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchMessages, sendMessage, subscribeToMessages } from '@/services/messagesService';
import { generateAIContent } from '@/services/aiService';
import { HumanApprovalModal } from '@/components/ui/HumanApprovalModal';
import type { ChatMessage } from '@/types';

export function Messages() {
  const { user, couple } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // AI Love Letter state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiDraft, setAIDraft] = useState<{ content: string; agent: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let channel: ReturnType<typeof subscribeToMessages> | null = null;

    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      const coupleId = couple?.id || 'demo-couple';

      const history = await fetchMessages(coupleId);
      setMessages(history);
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);

      // Subscribe to Realtime messages
      channel = subscribeToMessages(coupleId, (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 100);
      });
    }

    loadData();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [couple?.id, user]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const content = (customText || textInput).trim();
    if (!content || !user) return;

    setIsSending(true);
    const coupleId = couple?.id || 'demo-couple';

    const sent = await sendMessage({
      coupleId,
      senderId: user.id,
      content,
      messageType: customText === '❤️' ? 'heart' : 'text',
    });

    if (sent) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setTextInput('');
      setTimeout(scrollToBottom, 100);
    }

    setIsSending(false);
  };

  return (
    <div className="min-h-dvh bg-our-world px-5 py-6 sm:px-10 md:px-16 lg:px-20 w-full flex flex-col justify-between">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#B83B5E]/8 blur-3xl" />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#B83B5E]/20 border border-[#B83B5E]/40 flex items-center justify-center text-[#E98DA3]">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1
              className="text-2xl font-serif text-[#FFFCF9]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Intimate Chat
            </h1>
            <p className="text-xs text-[#9C8490] font-sans flex items-center gap-1">
              <ShieldCheck size={12} className="text-[#C9A45C]" />
              <span>Realtime • RLS Encrypted Channel</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSend(undefined, '❤️')}
          className="px-3 py-1.5 rounded-full bg-[#B83B5E]/20 border border-[#B83B5E]/40 text-[#E98DA3] text-xs font-sans hover:bg-[#B83B5E]/40 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Heart size={14} className="fill-[#E98DA3]" />
          <span>Send Heart</span>
        </button>
        <button
          disabled={isAILoading}
          onClick={async () => {
            setIsAILoading(true);
            const result = await generateAIContent({
              intent: 'love_letter',
              context: { partner_name: couple?.partner_name ?? 'My Love', topic: 'gratitude and love' },
            });
            setAIDraft({ content: result.draft_content, agent: result.agent_name });
            setIsAILoading(false);
          }}
          className="px-3 py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-xs font-sans hover:bg-[#C9A45C]/30 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Bot size={14} />
          <span>{isAILoading ? 'Drafting...' : 'AI Letter 💌'}</span>
        </button>

        {/* Human Approval Modal for love letters */}
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
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 relative z-10 my-2">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading secure connection...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-[#9C8490] font-sans text-sm">
            No messages yet. Send your first sweet message above! ❤️
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user ? msg.sender_id === user.id : false;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[65%] p-4 rounded-2xl text-sm font-sans leading-relaxed shadow-lg ${
                    isMe
                      ? 'bg-gradient-to-r from-[#B83B5E] to-[#922B48] text-[#FFFCF9] rounded-br-none border border-[#E98DA3]/30'
                      : 'glass-card bg-[#2E2028]/90 text-[#FFF8F2] rounded-bl-none border border-white/10'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-[#9C8490] mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <form onSubmit={handleSend} className="relative z-10 shrink-0 pt-2 pb-20 sm:pb-6">
        <div className="glass-card p-2 rounded-2xl border border-white/15 bg-[#241B20]/95 flex items-center gap-2">
          <input
            type="text"
            placeholder="Write a sweet message..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-[#FFFCF9] focus:outline-none placeholder-[#9C8490]/50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isSending}
            className="w-10 h-10 rounded-xl bg-[#B83B5E] hover:bg-[#922B48] text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
