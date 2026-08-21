import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';

interface SceneIntroProps {
  partnerName: string;
  onNext: () => void;
}

export function SceneIntro({ partnerName, onNext }: SceneIntroProps) {
  const [stage, setStage] = useState<'anticipation_1' | 'anticipation_2' | 'ready'>('anticipation_1');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStage('anticipation_2');
    }, 2400);

    const timer2 = setTimeout(() => {
      setStage('ready');
    }, 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
      {/* Ambient background glow & stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A45C]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B83B5E]/20 rounded-full blur-3xl" />

        {/* Floating twinkle stars */}
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.2, scale: 0.8 }}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.35,
            }}
            className="absolute text-[#C9A45C]/60"
            style={{
              top: `${12 + ((i * 23) % 75)}%`,
              left: `${8 + ((i * 37) % 85)}%`,
            }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'anticipation_1' && (
          <motion.div
            key="stage-1"
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -15 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="relative z-10 max-w-lg mx-auto space-y-4"
          >
            <div className="inline-flex p-3 rounded-full bg-[#B83B5E]/20 text-[#F4B8C9] mb-2 border border-[#B83B5E]/30">
              <Heart size={28} className="fill-[#F4B8C9]" />
            </div>
            <h1
              className="text-4xl sm:text-6xl font-light text-[#FFFCF9]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Hey, {partnerName || 'My Love'}... ❤️
            </h1>
            <p className="text-sm font-sans text-[#9C8490] tracking-wide">
              Step inside our private universe...
            </p>
          </motion.div>
        )}

        {stage === 'anticipation_2' && (
          <motion.div
            key="stage-2"
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -15 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="relative z-10 max-w-lg mx-auto space-y-4"
          >
            <div className="inline-flex p-3 rounded-full bg-[#E8C97A]/15 text-[#E8C97A] mb-2 border border-[#E8C97A]/30">
              <Sparkles size={28} />
            </div>
            <h2
              className="text-3xl sm:text-5xl font-light text-[#FFFCF9]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Before we begin your surprise...
            </h2>
            <p className="text-sm font-sans text-[#E8C97A]/80 tracking-widest uppercase">
              I have a few questions for you 👀
            </p>
          </motion.div>
        )}

        {stage === 'ready' && (
          <motion.div
            key="stage-ready"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 max-w-xl mx-auto space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-xs font-sans tracking-widest uppercase mb-2">
              <Sparkles size={14} />
              <span>A Special Cinematic Journey</span>
            </div>

            <h1
              className="text-4xl sm:text-6xl font-light text-[#FFFCF9] leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Are you ready, <br />
              <span className="bg-gradient-to-r from-[#E98DA3] via-[#FFFCF9] to-[#C9A45C] bg-clip-text text-transparent italic font-semibold">
                {partnerName || 'My Favorite Soul'}?
              </span>
            </h1>

            <FlowerAccent variant="rose" size={64} color="#C9A45C" opacity={0.5} className="mx-auto my-4" />

            <p className="text-sm sm:text-base text-[#9C8490] font-sans max-w-md mx-auto leading-relaxed">
              Every detail in this experience was hand-crafted with love, just for you.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] text-white text-sm font-sans font-semibold shadow-2xl hover:opacity-90 transition-opacity flex items-center gap-3 mx-auto cursor-pointer"
            >
              <span>Answer Questions & Begin</span>
              <Heart size={16} className="fill-white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
