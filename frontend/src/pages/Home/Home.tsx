import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Card } from '@/components/ui/Card';

export function Home() {
  const { user, couple, signOut } = useAuthStore();
  const navigate = useNavigate();

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
    { id: 'memories-tile',  emoji: '📸', label: 'Memories',  phase: 2 },
    { id: 'diary-tile',     emoji: '📔', label: 'Diary',     phase: 2 },
    { id: 'messages-tile',  emoji: '💌', label: 'Messages',  phase: 3 },
    { id: 'playlist-tile',  emoji: '🎵', label: 'Playlist',  phase: 3 },
    { id: 'events-tile',    emoji: '🗓️', label: 'Events',    phase: 3 },
    { id: 'gifts-tile',     emoji: '🎁', label: 'Gifts',     phase: 3 },
  ];

  return (
    <div className="min-h-dvh bg-our-world px-4 py-6 max-w-lg mx-auto w-full">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#B83B5E]/6 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-start justify-between mb-8 relative"
      >
        <div>
          <p className="text-[#9C8490] text-sm font-sans font-light tracking-wide">
            {greeting},
          </p>
          <h1
            className="text-2xl font-light text-[#FFFCF9] mt-0.5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {displayName} ❤️
          </h1>
          {couple?.couple_name && (
            <p className="text-[#C9A45C]/60 text-xs font-sans tracking-widest uppercase mt-1">
              {couple.couple_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            id="settings-btn"
            onClick={() => {}}
            className="text-[#9C8490] hover:text-[#E98DA3] transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            id="sign-out-btn"
            onClick={handleSignOut}
            className="text-[#9C8490] hover:text-red-400 transition-colors cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </motion.header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >

        {/* Days counter */}
        <motion.div variants={itemVariants}>
          <Card variant="dark" className="text-center py-8 relative overflow-hidden">
            <FlowerAccent
              variant="petal" size={30} color="#E98DA3" opacity={0.12} animate={false}
              className="absolute top-3 right-4"
            />
            <p className="text-[#9C8490] text-xs font-sans tracking-widest uppercase mb-2">
              We've been us for
            </p>
            <p
              className="text-6xl font-light text-[#FFFCF9] leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              —
            </p>
            <p className="caption-gold mt-1">DAYS</p>
            <p className="text-[#9C8490]/50 text-xs font-sans mt-3">
              Set your anniversary in settings
            </p>
          </Card>
        </motion.div>

        {/* Birthday countdown */}
        <motion.div variants={itemVariants}>
          <Card variant="gold" className="relative overflow-hidden">
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
                  Configure in settings
                </p>
              </div>
              <FlowerAccent
                variant="rose" size={44} color="#C9A45C" opacity={0.2} delay={0.5}
              />
            </div>
          </Card>
        </motion.div>

        {/* Navigation tiles */}
        <motion.div variants={itemVariants}>
          <p className="caption-gold mb-3">Our World</p>
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((tile) => (
              <motion.button
                key={tile.id}
                id={tile.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="glass-card p-5 text-left cursor-pointer group relative overflow-hidden"
                aria-label={`Go to ${tile.label}`}
                onClick={() => {}}
              >
                <span className="text-2xl mb-3 block">{tile.emoji}</span>
                <span className="text-[#FFFCF9] font-sans font-medium text-sm group-hover:text-[#E98DA3] transition-colors">
                  {tile.label}
                </span>
                <span className="absolute top-2 right-2 text-[8px] font-sans tracking-widest text-[#9C8490]/40 uppercase">
                  Phase {tile.phase}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="h-4" />
      </motion.div>
    </div>
  );
}
