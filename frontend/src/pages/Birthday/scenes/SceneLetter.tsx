import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';

interface SceneLetterProps {
  partnerName: string;
  customMessage?: string | null;
  onNext: () => void;
}

export function SceneLetter({ partnerName, customMessage, onNext }: SceneLetterProps) {
  const [letterText] = useState<string>(
    () =>
      customMessage ||
      `To ${partnerName || 'My Love'},\n\nOn this special day, I want to take a moment to tell you just how deeply grateful I am for your existence. Every quiet morning, shared smile, and midnight conversation with you adds a soft, golden brilliance to my life.\n\nYou make our little world feel whole, safe, and endlessly beautiful. Here is to celebrating your light today and walking hand in hand through all the chapters yet to come.\n\nWith all my love, always.`
  );

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#B83B5E]/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-4"
      >
        <p className="text-xs text-[#C9A45C] font-sans tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Heart size={13} className="fill-[#C9A45C]" />
          CHAPTER IV • THE BIRTHDAY SPEECH
        </p>
        <h2
          className="text-2xl sm:text-3xl text-[#FFFCF9] font-serif mt-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          A Letter From The Heart
        </h2>
      </motion.div>

      {/* Central Parchment Letter Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-10 my-auto w-full max-w-lg mx-auto glass-card p-6 sm:p-10 rounded-3xl border border-[#C9A45C]/40 bg-[#1F151B]/90 shadow-2xl text-left"
      >
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A45C]" />
            <span
              className="text-lg text-[#FFFCF9] font-serif"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              For {partnerName || 'My Love'}
            </span>
          </div>

          <span className="text-xs text-[#E8C97A] font-sans italic">
            With love ❤️
          </span>
        </div>

        <div className="prose text-sm sm:text-base text-[#FFF8F2] font-sans leading-relaxed whitespace-pre-wrap font-light max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {letterText}
        </div>
      </motion.div>

      {/* Bottom Action */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pb-6"
      >
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-[#FFFCF9] text-xs font-sans tracking-wider uppercase hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
        >
          <span>Listen To Our Song</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
