import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';

interface SceneRevealProps {
  partnerName: string;
  onNext: () => void;
}

export function SceneReveal({ partnerName, onNext }: SceneRevealProps) {
  const [phase, setPhase] = useState<'dim' | 'reveal' | 'celebrate'>('dim');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase('reveal');
    }, 2200);

    const timer2 = setTimeout(() => {
      setPhase('celebrate');
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#B83B5E]/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-[#C9A45C]/20 rounded-full blur-3xl" />
      </div>

      {/* Floating flower petals */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${(i * 21) % 100}vw`, opacity: 0, rotate: 0 }}
            animate={{
              y: '105vh',
              opacity: [0, 0.8, 0.8, 0],
              rotate: 360,
            }}
            transition={{
              duration: 5 + (i % 4),
              repeat: Infinity,
              delay: (i * 0.3) % 4,
              ease: 'linear',
            }}
            className="absolute text-sm"
          >
            {i % 2 === 0 ? '🌸' : '✨'}
          </motion.div>
        ))}
      </div>

      <div />

      {/* Center Cinematic Typography */}
      <div className="relative z-10 max-w-xl mx-auto my-auto space-y-6">
        {phase === 'dim' && (
          <motion.div
            key="dim"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="space-y-3"
          >
            <p
              className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Okay...
            </p>
            <p className="text-xs font-sans text-[#9C8490] tracking-widest uppercase">
              Now the real celebration begins.
            </p>
          </motion.div>
        )}

        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="space-y-4"
          >
            <div className="inline-flex p-3 rounded-full bg-[#E8C97A]/20 text-[#E8C97A] mb-1">
              <Sparkles size={32} />
            </div>
            <h1
              className="text-4xl sm:text-6xl font-light text-[#FFFCF9]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Happy Birthday, <br />
              <span className="bg-gradient-to-r from-[#F4B8C9] via-[#FFFCF9] to-[#E8C97A] bg-clip-text text-transparent italic font-semibold">
                {partnerName || 'My Love'} ❤️
              </span>
            </h1>
          </motion.div>
        )}

        {phase === 'celebrate' && (
          <motion.div
            key="celebrate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-6"
          >
            <FlowerAccent variant="rose" size={80} color="#F4B8C9" opacity={0.8} className="mx-auto" />
            <h1
              className="text-4xl sm:text-6xl font-light text-[#FFFCF9]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Make A Wish, <br />
              <span className="text-[#E8C97A] font-semibold">{partnerName || 'Darling'}</span>
            </h1>

            <p className="text-sm font-sans text-[#9C8490] max-w-md mx-auto leading-relaxed">
              The candles are lit and waiting for your breath.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="mt-6 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#B83B5E] to-[#E8C97A] text-white font-sans text-xs uppercase tracking-widest font-semibold shadow-xl hover:opacity-95 transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>See The Cake & Blow Candles</span>
              <ArrowRight size={14} />
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="pb-4" />
    </div>
  );
}
