import { motion } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';

interface SceneIntroProps {
  partnerName: string;
  onNext: () => void;
}

export function SceneIntro({ partnerName, onNext }: SceneIntroProps) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
      {/* Ambient background glow & stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A45C]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B83B5E]/20 rounded-full blur-3xl" />
        
        {/* Floating twinkle stars */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.2, scale: 0.8 }}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.4,
            }}
            className="absolute text-[#C9A45C]/60"
            style={{
              top: `${15 + ((i * 23) % 70)}%`,
              left: `${10 + ((i * 37) % 80)}%`,
            }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-xl mx-auto space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-xs font-sans tracking-widest uppercase mb-2">
          <Sparkles size={14} />
          <span>A Special Cinematic Milestone</span>
        </div>

        <h1
          className="text-4xl sm:text-6xl font-light text-[#FFFCF9] leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Happy Birthday, <br />
          <span className="bg-gradient-to-r from-[#E98DA3] via-[#FFFCF9] to-[#C9A45C] bg-clip-text text-transparent italic font-semibold">
            {partnerName || 'My Favorite Soul'}
          </span>
        </h1>

        <FlowerAccent variant="rose" size={64} color="#C9A45C" opacity={0.5} className="mx-auto my-4" />

        <p className="text-sm sm:text-base text-[#9C8490] font-sans max-w-md mx-auto leading-relaxed">
          Welcome to your private universe. Today, we step back into time and relive the magic of every moment we've shared.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] text-white text-sm font-sans font-semibold shadow-2xl hover:opacity-90 transition-opacity flex items-center gap-3 mx-auto cursor-pointer"
        >
          <span>Begin The Journey</span>
          <Heart size={16} className="fill-white" />
        </motion.button>
      </motion.div>
    </div>
  );
}
