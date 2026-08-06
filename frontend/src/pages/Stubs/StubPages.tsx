import { motion } from 'framer-motion';
import { MessageCircle, Calendar, Music, Gift, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';

interface StubProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  phase: number;
}

function StubView({ title, subtitle, icon, phase }: StubProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xs font-sans text-[#9C8490] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#C9A45C] font-sans">
          Phase {phase} Upcoming
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 sm:p-14 text-center max-w-lg mx-auto my-auto relative overflow-hidden border border-[#E98DA3]/20 shadow-2xl"
      >
        <FlowerAccent variant="rose" size={56} color="#E98DA3" opacity={0.2} className="mx-auto mb-6" />

        <div className="w-16 h-16 rounded-2xl bg-[#E98DA3]/10 border border-[#E98DA3]/30 text-[#E98DA3] flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>

        <h1
          className="text-3xl sm:text-4xl font-light text-[#FFFCF9] mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {title}
        </h1>

        <p className="text-sm text-[#9C8490] font-sans mb-8 leading-relaxed">
          {subtitle}
        </p>

        <div className="p-4 rounded-xl bg-black/40 border border-[#C9A45C]/30 text-xs text-[#C9A45C] font-sans flex items-center justify-center gap-2 mb-8">
          <Lock size={14} />
          <span>Scheduled for Phase {phase} Release</span>
        </div>

        <Button variant="primary" onClick={() => navigate('/home')}>
          Return to Dashboard ✨
        </Button>
      </motion.div>

      <div className="h-12" />
    </div>
  );
}

export function MessagesStub() {
  return (
    <StubView
      title="Intimate Realtime Messages"
      subtitle="Encrypted, private messaging for two with real-time presence and letter-lock animations."
      icon={<MessageCircle size={32} />}
      phase={3}
    />
  );
}

export function EventsStub() {
  return (
    <StubView
      title="Shared Calendar & Events"
      subtitle="Track upcoming anniversaries, date nights, and special relationship milestones."
      icon={<Calendar size={32} />}
      phase={3}
    />
  );
}

export function PlaylistStub() {
  return (
    <StubView
      title="Our World Playlist"
      subtitle="Your shared soundtrack — embed your favorite songs and romantic playlists."
      icon={<Music size={32} />}
      phase={3}
    />
  );
}

export function GiftsStub() {
  return (
    <StubView
      title="Gifts & Wishlist"
      subtitle="Surprise ideas, gift wishlists, and secret treasure chest logs for special occasions."
      icon={<Gift size={32} />}
      phase={3}
    />
  );
}
