import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Lock, Sparkles, X, Heart, Sparkle, Calendar, Bot } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchEvents } from '@/services/eventsService';
import { generateAIContent } from '@/services/aiService';
import { HumanApprovalModal } from '@/components/ui/HumanApprovalModal';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import type { CoupleEvent } from '@/types';

export function Home() {
  const { user, couple, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [nextEvent, setNextEvent] = useState<CoupleEvent | null>(null);

  // AI Surprise Idea state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiDraft, setAIDraft] = useState<{ content: string; agent: string } | null>(null);

  const displayName = user?.profile?.display_name || 'My Love';

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

  useEffect(() => {
    async function loadNextEvent() {
      const coupleId = couple?.id || 'demo-couple';
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
    }
    loadNextEvent();
  }, [couple?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const tiles = [
    { id: 'memories-tile',  emoji: '📸', label: 'Memories',     route: '/memories',      desc: 'Shared gallery & memory timeline' },
    { id: 'diary-tile',     emoji: '📔', label: 'Diary',        route: '/diary',         desc: 'Private & shared notebook entries' },
    { id: 'messages-tile',  emoji: '💌', label: 'Messages',     route: '/messages',      desc: 'Intimate realtime chat' },
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10"
      >
        <div>
          <p className="text-[#9C8490] text-xs sm:text-sm font-sans font-light tracking-wide flex items-center gap-1.5 mb-1">
            <span>{greeting}</span>
            <Sparkles size={14} className="text-[#C9A45C]" />
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {displayName} <Heart size={24} className="inline fill-[#B83B5E] text-[#B83B5E] ml-1.5" />
          </h1>
          {couple?.couple_name && (
            <p className="text-[#C9A45C]/90 text-xs sm:text-sm font-sans tracking-widest uppercase mt-1">
              {couple.couple_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            id="onboarding-btn"
            onClick={() => navigate('/onboarding')}
            className="px-3.5 py-2 rounded-xl bg-[#E98DA3]/10 border border-[#E98DA3]/30 text-[#E98DA3] text-xs font-sans font-medium hover:bg-[#E98DA3]/20 transition-all cursor-pointer flex items-center gap-1.5"
            aria-label="Setup / Edit Couple Details"
          >
            <Sparkle size={14} />
            <span>Onboarding Details</span>
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

      {/* Notice popup */}
      <AnimatePresence>
        {activeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="mb-8 p-4 rounded-2xl glass-card border-[#C9A45C]/30 bg-[#C9A45C]/10 text-xs sm:text-sm text-[#FFF8F2] flex items-center justify-between shadow-xl relative z-10"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-[#C9A45C] shrink-0" />
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
            <Card variant="dark" className="relative overflow-hidden border border-[#E98DA3]/30 h-full flex flex-col justify-between p-6 sm:p-7 bg-gradient-to-br from-[#2E2028] to-[#241B20]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="caption-gold text-[11px] mb-2 flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#C9A45C]" />
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
                        No Events Yet
                      </p>
                      <p className="text-xs text-[#9C8490] font-sans mt-1">
                        Plan your next date or trip together
                      </p>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('/events')}
                className="text-[#C9A45C] hover:text-white text-xs font-sans mt-4 text-left underline transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{nextEvent ? 'View all events & countdowns' : '+ Add upcoming date or trip'}</span>
              </button>
            </Card>
          </motion.div>
        </div>

        {/* Navigation tiles Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="caption-gold text-xs">Our World Spaces</p>
            <span className="text-[11px] text-[#E98DA3] font-sans px-2.5 py-1 rounded-full bg-[#E98DA3]/10 border border-[#E98DA3]/20">
              Private & Protected 🔐
            </span>
          </div>

          {/* Grid layout (4 columns on desktop, 2 on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {tiles.map((tile, i) => (
              <motion.button
                key={tile.id}
                id={tile.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                whileHover={{ scale: 1.02, translateY: -3 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card p-5 sm:p-6 text-left cursor-pointer group relative overflow-hidden transition-all duration-200 hover:border-[#E98DA3]/40 flex flex-col justify-between min-h-[140px]"
                aria-label={`Go to ${tile.label}`}
                onClick={() => navigate(tile.route)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{tile.emoji}</span>
                </div>
                <div>
                  <span className="text-[#FFFCF9] font-sans font-semibold text-base group-hover:text-[#E98DA3] transition-colors block">
                    {tile.label}
                  </span>
                  <span className="text-xs text-[#9C8490]/90 font-sans mt-1 block leading-relaxed line-clamp-2">
                    {tile.desc}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* AI Surprise Date Idea Section */}
        <div className="pt-2">
          <div className="glass-card p-6 sm:p-7 rounded-2xl border border-[#C9A45C]/20 bg-gradient-to-r from-[#2E2028]/90 to-[#241B20]/95 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="caption-gold text-xs mb-1 flex items-center gap-1.5">
                <Bot size={13} className="text-[#C9A45C]" />
                AI SURPRISE GENERATOR
              </p>
              <h3 className="text-xl sm:text-2xl text-[#FFFCF9] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Need a surprise date idea?
              </h3>
              <p className="text-xs sm:text-sm text-[#9C8490] font-sans mt-1">Our private AI will suggest a romantic date plan. You approve it first. ✨</p>
            </div>
            <button
              disabled={isAILoading}
              onClick={async () => {
                setIsAILoading(true);
                const result = await generateAIContent({
                  intent: 'surprise_idea',
                  context: { preference: 'cozy and romantic' },
                });
                setAIDraft({ content: result.draft_content, agent: result.agent_name });
                setIsAILoading(false);
              }}
              className="shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] text-white text-sm font-sans font-semibold hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-40 shadow-lg shadow-[#B83B5E]/20"
            >
              <Sparkles size={16} />
              <span>{isAILoading ? 'Thinking...' : 'Surprise Me 💡'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Human Approval Modal for surprise date ideas */}
      <HumanApprovalModal
        isOpen={!!aiDraft}
        agentName={aiDraft?.agent ?? ''}
        intent="surprise_idea"
        draftContent={aiDraft?.content ?? ''}
        onApprove={(approved) => {
          setActiveNotice(`💡 Date Idea: ${approved}`);
          setAIDraft(null);
        }}
        onReject={() => setAIDraft(null)}
      />

      <div className="h-4" />
    </PageContainer>
  );
}
