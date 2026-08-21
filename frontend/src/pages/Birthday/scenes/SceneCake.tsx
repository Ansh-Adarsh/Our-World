import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, ArrowRight } from 'lucide-react';
import { CandleCake } from '@/components/journey/CandleCake';
import { Celebration, HeartBurst } from '@/components/journey/JourneyParticles';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { useBlowDetection } from '@/hooks/useBlowDetection';
import { playPuff, playCelebration } from '@/utils/sound';

interface SceneCakeProps {
  partnerName: string;
  onNext: () => void;
}

export function SceneCake({ partnerName, onNext }: SceneCakeProps) {
  const [litFlags, setLitFlags] = useState<boolean[]>([true, true, true]);
  const [celebrating, setCelebrating] = useState(0);
  const allOut = litFlags.every((lit) => !lit);

  const extinguish = (index: number) => {
    setLitFlags((flags) => {
      if (!flags[index]) return flags;
      const next = [...flags];
      next[index] = false;
      return next;
    });
    playPuff(true);
  };

  const extinguishAll = () => {
    setLitFlags((flags) => (flags.every((lit) => !lit) ? flags : flags.map(() => false)));
    playPuff(true);
  };

  const { status: micStatus, start: startListening } = useBlowDetection(extinguishAll);

  useEffect(() => {
    if (allOut) {
      setCelebrating((c) => c + 1);
      playCelebration(true);
    }
  }, [allOut]);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Background ambient lighting & floating petals */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#C9A45C]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#B83B5E]/15 rounded-full blur-3xl" />
        
        {/* Subtle romantic corner accents */}
        <div className="absolute top-6 left-6 opacity-30">
          <FlowerAccent variant="sakura" size={60} color="#F4B8C9" />
        </div>
        <div className="absolute top-6 right-6 opacity-30">
          <FlowerAccent variant="rose" size={60} color="#E8C97A" />
        </div>
      </div>

      <Celebration trigger={celebrating} />
      <HeartBurst trigger={celebrating} />

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 pt-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-xs font-sans tracking-widest uppercase mb-2">
          <Sparkles size={14} />
          <span>CHAPTER II • MAKE A WISH</span>
        </div>
        <h2
          className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {allOut ? 'Your Wish Is In The Stars ✨' : `Blow out the candles, ${partnerName || 'My Love'} 🎂`}
        </h2>
      </motion.div>

      {/* Central Viewport-Centered Cake Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="relative z-10 my-auto w-full max-w-[320px] sm:max-w-[380px] mx-auto flex flex-col items-center justify-center"
      >
        <CandleCake litFlags={litFlags} onTapCandle={extinguish} interactive={!allOut} />

        <div className="mt-8 min-h-[80px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {allOut ? (
              <motion.div
                key="celebrating-msg"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="space-y-3"
              >
                <p
                  className="text-xl sm:text-2xl text-[#E8C97A] font-light leading-relaxed"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  May every dream you hold close unfold with grace and wonder. ❤️
                </p>
                <p className="text-xs text-[#9C8490] font-sans">
                  The candles are out — your surprise experience is just beginning...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="prompt-controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <p className="text-xs sm:text-sm text-[#9C8490] font-sans">
                  Tap the candles or make a wish together ✨
                </p>

                {micStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={() => void startListening()}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F4B8C9]/25 bg-white/5 text-xs text-[#F4B8C9] hover:bg-white/10 transition-colors cursor-pointer font-sans"
                  >
                    <Mic size={13} />
                    <span>or blow into the microphone</span>
                  </button>
                )}

                {micStatus === 'requesting' && (
                  <p className="text-xs text-[#9C8490] font-sans">Listening for permission...</p>
                )}

                {micStatus === 'listening' && (
                  <p className="text-xs text-[#E8C97A] font-sans animate-pulse flex items-center gap-1.5">
                    <Mic size={13} />
                    <span>Microphone ready — blow softly into your mic!</span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom Button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 pb-4"
      >
        <button
          type="button"
          onClick={onNext}
          className={`px-8 py-3.5 rounded-full font-sans text-xs uppercase tracking-widest font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
            allOut
              ? 'bg-gradient-to-r from-[#B83B5E] to-[#E8C97A] text-white hover:opacity-95 shadow-[#B83B5E]/40'
              : 'bg-white/10 border border-white/20 text-[#FFFCF9] hover:bg-white/20'
          }`}
        >
          <span>{allOut ? 'Unfold Your Surprise' : 'Skip To Surprise'}</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
