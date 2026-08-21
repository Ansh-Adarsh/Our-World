import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  LogOut,
  Lock,
  Sparkles,
  X,
  Heart,
  Sparkle,
  Calendar,
  Bot,
  UserPlus,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchEvents, subscribeToEvents } from '@/services/eventsService';
import { getUnreadMessageCount, subscribeToMessages } from '@/services/messagesService';
import { generateAIContent } from '@/services/aiService';
import { HumanApprovalModal } from '@/components/ui/HumanApprovalModal';
import { PartnerConnectModal } from '@/components/ui/PartnerConnectModal';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import type { CoupleEvent } from '@/types';

export function Home() {
  const { user, couple, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [nextEvent, setNextEvent] = useState<CoupleEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  // AI Surprise Idea state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiDraft, setAIDraft] = useState<{ content: string; agent: string } | null>(null);

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'My Love';
  const partnerName = couple?.partner_name || 'Partner';
  const isPartnerConnected = !!couple?.partner_2_id;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  // Calculate live days together
  const daysTogether = useMemo(() => {
    if (!couple?.anniversary_date) return null;
    const start = new Date(couple.anniversary_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [couple?.anniversary_date]);

  // Calculate live birthday countdown
  const daysToBirthday = useMemo(() => {
    if (!couple?.partner_birthday) return null;
    const today = new Date();
    const bday = new Date(couple.partner_birthday);
    const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    
    if (nextBday < today) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = nextBday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [couple?.partner_birthday]);

  const coupleId = couple?.id;

  useEffect(() => {
    if (!coupleId) return;

    async function loadNextEvent() {
      if (!coupleId) return;
      try {
        const evts = await fetchEvents(coupleId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = evts
          .filter((e) => {
            const d = new Date(e.event_date);
            d.setHours(0, 0, 0, 0);
            return d >= today;
          })
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        if (upcoming.length > 0) {
          setNextEvent(upcoming[0]);
        } else {
          setNextEvent(null);
        }
      } catch (err) {
        console.error('[Home] loadNextEvent error:', err);
      }
    }

    async function loadUnreads() {
      if (user?.id && coupleId) {
        try {
          const count = await getUnreadMessageCount(coupleId, user.id);
          setUnreadCount(count);
        } catch {
          setUnreadCount(0);
        }
      }
    }

    loadNextEvent();
    loadUnreads();

    // Subscribe to realtime event changes
    const eventChannel = subscribeToEvents(coupleId, () => {
      loadNextEvent();
    });

    // Subscribe to realtime messages for unread badge updates
    const messageChannel = subscribeToMessages(coupleId, () => {
      loadUnreads();
    });

    return () => {
      if (eventChannel) eventChannel.unsubscribe();
      if (messageChannel) messageChannel.unsubscribe();
    };
  }, [coupleId, user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const tiles = [
    { id: 'memories-tile',  emoji: '📸', label: 'Memories',     route: '/memories',      desc: 'Shared gallery & memory timeline' },
    { id: 'diary-tile',     emoji: '📔', label: 'Diary',        route: '/diary',         desc: 'Private & shared notebook entries' },
    { id: 'messages-tile',  emoji: '💌', label: 'Messages',     route: '/messages',      desc: 'Intimate realtime chat', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'playlist-tile',  emoji: '🎵', label: 'Playlist',     route: '/playlist',      desc: 'Our shared music soundtrack' },
    { id: 'events-tile',    emoji: '🗓️', label: 'Events',       route: '/events',        desc: 'Anniversaries & countdowns' },
    { id: 'gifts-tile',     emoji: '🎁', label: 'Gifts',        route: '/gifts',         desc: 'Wishlist & surprise gifts' },
    { id: 'quizzes-tile',   emoji: '🎮', label: 'Quizzes',      route: '/quizzes',       desc: 'Trivia: How well do you know us?' },
    { id: 'understanding',  emoji: '🕊️', label: 'Understanding',route: '/understanding', desc: 'Calm space for resolving disagreements' },
  ];

  return (
    <PageContainer>
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-[#5A2435]/20 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10 relative z-10"
      >
        <div>
          <p className="text-[#9C8490] text-xs sm:text-sm font-sans font-light tracking-wide flex items-center gap-1.5 mb-1">
            <span>{greeting}, {displayName}</span>
            <Sparkles size={14} className="text-[#E8C97A]" />
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {displayName} <Heart size={24} className="inline fill-[#B83B5E] text-[#B83B5E] mx-1.5" /> {partnerName}
          </h1>
          {couple?.couple_name && (
            <p className="text-[#E8C97A]/90 text-xs sm:text-sm font-sans tracking-widest uppercase mt-1">
              {couple.couple_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            id="partner-connect-btn"
            onClick={() => setIsPartnerModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#B83B5E]/20 border border-[#B83B5E]/40 text-[#F4B8C9] text-xs font-sans font-medium hover:bg-[#B83B5E]/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            aria-label="Connect / Invite Partner"
          >
            <UserPlus size={14} />
            <span>{isPartnerConnected ? 'Partner Linked ❤️' : 'Invite Partner'}</span>
          </button>

          <button
            id="onboarding-btn"
            onClick={() => navigate('/onboarding')}
            className="px-3.5 py-2 rounded-xl bg-[#F4B8C9]/10 border border-[#F4B8C9]/30 text-[#F4B8C9] text-xs font-sans font-medium hover:bg-[#F4B8C9]/20 transition-all cursor-pointer flex items-center gap-1.5"
            aria-label="Setup / Edit Couple Details"
          >
            <Sparkle size={14} />
            <span>Our Story Details</span>
          </button>

          <button
            id="settings-btn"
            onClick={() => navigate('/settings')}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#9C8490] hover:text-[#F4B8C9] hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          <button
            id="sign-out-btn"
            onClick={handleSignOut}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#9C8490] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </motion.header>

      {/* Two-Person Shared World Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 p-4 rounded-2xl glass-card border-[#F4B8C9]/20 bg-gradient-to-r from-[#2E2028]/95 to-[#241B20]/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#B83B5E]/20 text-[#F4B8C9]">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-sans font-medium text-[#FFFCF9] flex items-center gap-2">
              <span>Shared Sanctuary • Real-Time Synchronization Active</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px]">
                RLS Protected
              </span>
            </p>
            <p className="text-[11px] font-sans text-[#9C8490]">
              Whatever you add here appears instantly in {partnerName}'s world.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/messages')}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-sans text-[#F4B8C9] border border-white/10 transition-colors flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
        >
          <Heart size={13} className="fill-[#F4B8C9]" />
          <span>Open Shared Chat</span>
        </button>
      </motion.div>

      {/* Notice popup */}
      <AnimatePresence>
        {activeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="mb-8 p-4 rounded-2xl glass-card border-[#E8C97A]/30 bg-[#E8C97A]/10 text-xs sm:text-sm text-[#FFF8F2] flex items-center justify-between shadow-xl relative z-10"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-[#E8C97A] shrink-0" />
              <span className="font-sans leading-relaxed">{activeNotice}</span>
            </div>
            <button
              onClick={() => setActiveNotice(null)}
              className="text-[#9C8490] hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8 relative z-10">
        {/* Days, Birthday & Next Event Counter Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Days counter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card variant="dark" className="text-center py-7 px-6 relative overflow-hidden border border-[#F4B8C9]/25 h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
              <FlowerAccent
                variant="sakura" size={36} color="#F4B8C9" opacity={0.25} animate={true}
                className="absolute top-3 right-4"
              />
              <p className="text-[#9C8490] text-xs font-sans tracking-widest uppercase mb-1">
                We've been us for
              </p>
              <p
                className="text-5xl sm:text-6xl font-light text-[#FFFCF9] leading-none my-2"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {daysTogether !== null ? daysTogether : '—'}
              </p>
              <p className="caption-gold text-[11px] mt-1 text-[#E8C97A]">DAYS TOGETHER</p>
              <button
                onClick={() => navigate('/onboarding')}
                className="text-[#9C8490]/70 hover:text-[#F4B8C9] text-xs font-sans mt-3 underline transition-colors cursor-pointer"
              >
                {daysTogether !== null ? 'Update anniversary date' : 'Set anniversary date'}
              </button>
            </Card>
          </motion.div>

          {/* Birthday countdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card variant="gold" className="relative overflow-hidden border border-[#E8C97A]/30 h-full flex flex-col justify-between p-6 sm:p-7 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
              <div className="flex items-start justify-between">
                <div>
                  <p className="caption-gold text-[11px] mb-2 text-[#E8C97A]">🎂 Birthday Countdown</p>
                  <p
                    className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {daysToBirthday !== null ? `${daysToBirthday} Days` : 'Set Birthday'}
                  </p>
                  {couple?.partner_name && (
                    <p className="text-xs text-[#F4B8C9] font-sans mt-1">
                      For {couple.partner_name}
                    </p>
                  )}
                </div>
                <FlowerAccent
                  variant="rose" size={44} color="#F4B8C9" opacity={0.35} delay={0.2}
                />
              </div>
              <button
                onClick={() => navigate('/onboarding')}
                className="text-[#9C8490] hover:text-[#FFFCF9] text-xs font-sans mt-4 text-left underline transition-colors cursor-pointer"
              >
                {daysToBirthday !== null ? 'A special cinematic surprise awaits' : 'Set partner birthday in onboarding'}
              </button>
            </Card>
          </motion.div>

          {/* Next Upcoming Event Ticker */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card variant="dark" className="relative overflow-hidden border border-[#F4B8C9]/30 h-full flex flex-col justify-between p-6 sm:p-7 bg-gradient-to-br from-[#2E2028] to-[#241B20]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="caption-gold text-[11px] mb-2 flex items-center gap-1.5 text-[#E8C97A]">
                    <Calendar size={13} className="text-[#E8C97A]" />
                    Next Event Ticker
                  </p>
                  {nextEvent ? (
                    <>
                      <p
                        className="text-2xl sm:text-3xl font-light text-[#FFFCF9]"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {nextEvent.title}
                      </p>
                      <p className="text-xs text-[#9C8490] font-sans mt-1">
                        {new Date(nextEvent.event_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <p
                        className="text-2xl font-light text-[#FFFCF9]"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        No Upcoming Event
                      </p>
                      <p className="text-xs text-[#9C8490] font-sans mt-1">
                        Add a date night or getaway in Events
                      </p>
                    </>
                  )}
                </div>
                <FlowerAccent
                  variant="sakura" size={40} color="#F4B8C9" opacity={0.3} delay={0.3}
                />
              </div>

              <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => navigate('/events')}
                  className="text-xs font-sans text-[#F4B8C9] hover:underline cursor-pointer"
                >
                  View All Events →
                </button>
                {nextEvent && (
                  <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#E8C97A]">
                    Live Countdown
                  </span>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Feature Grid (4 Columns) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-2xl font-light text-[#FFFCF9]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Our World Spaces
            </h2>
            <span className="text-xs font-sans text-[#9C8490]">Tap any space to open</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiles.map((tile, idx) => (
              <motion.div
                key={tile.id}
                id={tile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  variant="dark"
                  onClick={() => navigate(tile.route)}
                  className="p-5 cursor-pointer hover:border-[#F4B8C9]/40 transition-all group flex flex-col justify-between h-full bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/95 border border-white/10 relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl p-2 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                        {tile.emoji}
                      </span>
                      {tile.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#B83B5E] text-white text-[11px] font-sans font-bold shadow-lg shadow-[#B83B5E]/50 animate-pulse">
                          {tile.badge}
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-xl font-light text-[#FFFCF9] group-hover:text-[#F4B8C9] transition-colors mb-1"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {tile.label}
                    </h3>
                    <p className="text-xs text-[#9C8490] font-sans leading-relaxed">
                      {tile.desc}
                    </p>
                  </div>
                  <span className="text-[11px] font-sans text-[#F4B8C9]/60 group-hover:text-[#F4B8C9] transition-colors mt-4 block">
                    Enter space →
                  </span>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Surprise Companion Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card variant="gold" className="p-6 sm:p-8 relative overflow-hidden border border-[#E8C97A]/30 bg-gradient-to-r from-[#2E2028]/95 to-[#241B20]/95">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
                  <Bot size={14} />
                  OUR WORLD AI COMPANION
                </p>
                <h3
                  className="text-2xl font-light text-[#FFFCF9] mb-1"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Looking for a romantic surprise idea for {partnerName}?
                </h3>
                <p className="text-xs text-[#9C8490] font-sans max-w-xl">
                  Let your private relationship AI generate thoughtful date ideas or sweet notes. All ideas require your manual review.
                </p>
              </div>

              <button
                type="button"
                disabled={isAILoading}
                onClick={async () => {
                  setIsAILoading(true);
                  const result = await generateAIContent({
                    intent: 'surprise_idea',
                    context: { partner_name: partnerName, preferences: 'cozy, romantic, long distance' },
                  });
                  setAIDraft({ content: result.draft_content, agent: result.agent_name });
                  setIsAILoading(false);
                }}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#B83B5E] to-[#E8C97A] text-white text-xs font-sans font-semibold hover:opacity-95 transition-opacity shrink-0 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isAILoading ? 'Thinking...' : 'Get Surprise Idea ✨'}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Partner Connection Modal */}
      <PartnerConnectModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
      />

      {/* Human Approval Modal for AI Surprise Idea */}
      <HumanApprovalModal
        isOpen={!!aiDraft}
        agentName={aiDraft?.agent ?? ''}
        intent="surprise_idea"
        draftContent={aiDraft?.content ?? ''}
        onApprove={(approved) => {
          setActiveNotice(`AI Surprise Idea: ${approved}`);
          setAIDraft(null);
        }}
        onReject={() => setAIDraft(null)}
      />
    </PageContainer>
  );
}
