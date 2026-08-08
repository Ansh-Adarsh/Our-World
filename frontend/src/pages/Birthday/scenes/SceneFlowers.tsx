import { motion } from 'framer-motion';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { ArrowRight } from 'lucide-react';

interface SceneFlowersProps {
  onNext: () => void;
}

export function SceneFlowers({ onNext }: SceneFlowersProps) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E98DA3]/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-4"
      >
        <p className="text-xs text-[#C9A45C] font-sans tracking-widest uppercase">
          CHAPTER I • THE FLOWERING OF US
        </p>
        <h2
          className="text-2xl sm:text-3xl text-[#FFFCF9] font-serif mt-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Like a Garden in Spring
        </h2>
      </motion.div>

      {/* Central Flower Blooming Motion */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.1, rotate: -45, opacity: 0 }}
          animate={{ scale: [0.1, 1.15, 1], rotate: 0, opacity: 1 }}
          transition={{ duration: 2.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative"
        >
          <FlowerAccent variant="rose" size={180} color="#E98DA3" opacity={0.9} />
          
          {/* Inner blooming glow */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-[#E98DA3]/20 blur-xl"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="text-sm sm:text-base text-[#9C8490] font-sans italic max-w-sm mt-8 leading-relaxed"
        >
          "Every memory we create is a petal in the garden of our shared world."
        </motion.p>
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2.2 }}
        className="relative z-10 pb-6"
      >
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-[#FFFCF9] text-xs font-sans tracking-wider uppercase hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
        >
          <span>Unfold Memories</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
