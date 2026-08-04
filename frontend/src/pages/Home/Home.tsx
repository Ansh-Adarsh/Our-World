import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Lock, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Card } from '@/components/ui/Card';

export function Home() {
  const { user, couple, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  const displayName = user?.profile?.display_name || 'My Love';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const tiles = [
    { id: 'memories-tile',  emoji: '📸', label: 'Memories',  phase: 2, desc: 'Shared gallery & memory timeline' },
    { id: 'diary-tile',     emoji: '📔', label: 'Diary',     phase: 2, desc: 'Private & shared notebook entries' },
    { id: 'messages-tile',  emoji: '💌', label: 'Messages',  phase: 3, desc: 'Intimate realtime chat' },
    { id: 'playlist-tile',  emoji: '🎵', label: 'Playlist',  phase: 3, desc: 'Our favorite songs' },
    { id: 'events-tile',    emoji: '🗓️', label: 'Events',    phase: 3, desc: 'Anniversaries & special dates' },
    { id: 'gifts-tile',     emoji: '🎁', label: 'Gifts',     phase: 3, desc: 'Wishlist & treasure chest' },
  ];

  const handleTileClick = (tile: typeof tiles[0]) => {
    setActiveNotice(`"${tile.label}" will be unlocked in Phase ${tile.phase} (${tile.desc}).`);
  };

  return (
    <div className="min-h-dvh bg-our-world px-4 py-6 max-w-lg mx-auto w-full flex flex-col justify-between">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#B83B5E]/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full bg-[#5A2435]/20 blur-3xl" />
      </div>

      <div>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-start justify-between mb-8 relative"
        >
          <div>
            <p className="text-[#9C8490] text-sm font-sans font-light tracking-wide flex items-center gap-1.5">
              <span>{greeting}</span>
              <Sparkles size={14} className="text-[#C9A45C]" />
            </p>
            <h1
              className="text-3xl font-light text-[#FFFCF9] mt-0.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {displayName} ❤️
            </h1>
            {couple?.couple_name && (
              <p className="text-[#C9A45C]/80 text-xs font-sans tracking-widest uppercase mt-1">
                {couple.couple_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              id="settings-btn"
              onClick={() => setActiveNotice('Settings will be fully customizable in upcoming phases.')}
              className="p-2 rounded-xl text-[#9C8490] hover:text-[#E98DA3] hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              className="p-2 rounded-xl text-[#9C8490] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </motion.header>

        {/* Phase notice popup */}
        <AnimatePresence>
          {activeNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 p-4 rounded-2xl glass-card border-[#C9A45C]/30 bg-[#C9A45C]/10 text-xs sm:text-sm text-[#FFF8F2] flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <Lock size={16} className="text-[#C9A45C] shrink-0" />
                <span>{activeNotice}</span>
              </div>
              <button
                onClick={() => setActiveNotice(null)}
                className="text-[#9C8490] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >

          {/* Days counter */}
          <motion.div variants={itemVariants}>
            <Card variant="dark" className="text-center py-8 relative overflow-hidden border border-[#E98DA3]/15">
              <FlowerAccent
                variant="petal" size={30} color="#E98DA3" opacity={0.15} animate={false}
                className="absolute top-3 right-4"
              />
              <p className="text-[#9C8490] text-xs font-sans tracking-widest uppercase mb-2">
                We've been us for
              </p>
              <p
                className="text-6xl font-light text-[#FFFCF9] leading-none my-1"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                —
              </p>
              <p className="caption-gold mt-1">DAYS</p>
              <p className="text-[#9C8490]/60 text-xs font-sans mt-3">
                Set your anniversary date in settings
              </p>
            </Card>
          </motion.div>

          {/* Birthday countdown */}
          <motion.div variants={itemVariants}>
            <Card variant="gold" className="relative overflow-hidden border border-[#C9A45C]/25">
              <div className="flex items-center justify-between">
                <div>
                  <p className="caption-gold mb-1">🎂 Birthday Countdown</p>
                  <p
                    className="text-3xl font-light text-[#FFFCF9]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    — Days
                  </p>
                  <p className="text-[#9C8490] text-xs font-sans mt-1">
                    Special experience awaiting
                  </p>
                </div>
                <FlowerAccent
                  variant="rose" size={48} color="#C9A45C" opacity={0.25} delay={0.5}
                />
              </div>
            </Card>
          </motion.div>

          {/* Navigation tiles */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <p className="caption-gold">Our World</p>
              <span className="text-[11px] text-[#9C8490] font-sans">Phase 1 Foundation</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {tiles.map((tile) => (
                <motion.button
                  key={tile.id}
                  id={tile.id}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card p-5 text-left cursor-pointer group relative overflow-hidden transition-all duration-200 hover:border-[#E98DA3]/30"
                  aria-label={`Go to ${tile.label}`}
                  onClick={() => handleTileClick(tile)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{tile.emoji}</span>
                    <span className="text-[9px] font-sans tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#9C8490] uppercase">
                      P{tile.phase}
                    </span>
                  </div>
                  <span className="text-[#FFFCF9] font-sans font-medium text-sm group-hover:text-[#E98DA3] transition-colors block">
                    {tile.label}
                  </span>
                  <span className="text-[11px] text-[#9C8490]/70 font-sans mt-0.5 line-clamp-1 block">
                    {tile.desc}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>

      <div className="h-6" />
    </div>
  );
}
