import { motion } from 'framer-motion';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Sparkles, Heart, RotateCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SceneFinalProps {
  partnerName: string;
  onRestart: () => void;
}

export function SceneFinal({ partnerName, onRestart }: SceneFinalProps) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Falling confetti / sparkle particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              y: -20,
              x: `${(i * 17) % 100}vw`,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              y: '105vh',
              opacity: [0, 1, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: (i * 0.25) % 3,
              ease: 'linear',
            }}
            className="absolute text-xs"
            style={{
              color: i % 2 === 0 ? '#C9A45C' : '#E98DA3',
            }}
          >
            {i % 3 === 0 ? '✨' : i % 3 === 1 ? '🌸' : '❤️'}
          </motion.div>
        ))}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A45C]/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-xs font-sans tracking-widest uppercase mb-3">
          <Sparkles size={14} />
          <span>OUR WORLD KEEPS GROWING</span>
        </div>
      </motion.div>

      {/* Central Flower & Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-10 my-auto flex flex-col items-center max-w-lg mx-auto"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          <FlowerAccent variant="rose" size={100} color="#E98DA3" opacity={0.9} />
        </motion.div>

        <h1
          className="text-3xl sm:text-5xl font-light text-[#FFFCF9] leading-tight mb-4"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Happy Birthday, <br />
          <span className="text-[#C9A45C] font-semibold">{partnerName || 'My Love'}</span>
        </h1>

        <p className="text-sm sm:text-base text-[#9C8490] font-sans leading-relaxed max-w-md mx-auto">
          Thank you for making every day extraordinary. Our world is richer, warmer, and infinitely more beautiful because of you.
        </p>

        <div className="flex items-center gap-1 mt-6 text-[#E98DA3]">
          <Heart size={16} className="fill-[#E98DA3]" />
          <Heart size={20} className="fill-[#E98DA3]" />
          <Heart size={16} className="fill-[#E98DA3]" />
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="relative z-10 pb-8 flex flex-wrap items-center justify-center gap-4"
      >
        <button
          onClick={onRestart}
          className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-[#FFFCF9] text-xs font-sans tracking-wider uppercase hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
        >
          <RotateCcw size={14} />
          <span>Replay Experience</span>
        </button>

        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] text-white text-xs font-sans tracking-wider uppercase font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <Home size={14} />
          <span>Return To Dashboard</span>
        </button>
      </motion.div>
    </div>
  );
}
