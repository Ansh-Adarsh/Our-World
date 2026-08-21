import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { HeartBurst } from '@/components/journey/JourneyParticles';
import { playUnlock, playPuff } from '@/utils/sound';
import type { SurpriseQuestion } from '@/types';

interface SceneQuestionsProps {
  questions: SurpriseQuestion[];
  partnerName: string;
  onNext: () => void;
}

export function SceneQuestions({ questions, partnerName, onNext }: SceneQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noOffset, setNoOffset] = useState({ x: 0, y: 0 });
  const [yesScale, setYesScale] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [revealText, setRevealText] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);
  const [dodgeCount, setDodgeCount] = useState(0);

  if (!questions || questions.length === 0) {
    onNext();
    return null;
  }

  const currentQ = questions[currentIndex];
  const isEscape = currentQ.no_button_behavior === 'escape' || !currentQ.no_button_behavior;

  const handleNoInteraction = () => {
    const behavior = currentQ.no_button_behavior || 'escape';
    setDodgeCount((c) => c + 1);
    playPuff(true);

    if (behavior === 'escape') {
      // Safe bounded offsets (keeps inside card container)
      const randomX = (Math.random() > 0.5 ? 1 : -1) * (50 + Math.random() * 80);
      const randomY = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 45);
      setNoOffset({ x: randomX, y: randomY });
      setYesScale((prev) => Math.min(prev + 0.1, 1.6));
    } else if (behavior === 'grow_yes') {
      setYesScale((prev) => Math.min(prev + 0.2, 2.0));
    } else if (behavior === 'shake') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleYes = () => {
    playUnlock(true);
    setBurstCount((c) => c + 1);
    setRevealText(currentQ.reveal_message || 'I knew it! You are my whole world ❤️');

    setTimeout(() => {
      setRevealText(null);
      setNoOffset({ x: 0, y: 0 });
      setYesScale(1);
      setDodgeCount(0);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onNext();
      }
    }, 1800);
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B83B5E]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C9A45C]/15 rounded-full blur-3xl" />
      </div>

      <HeartBurst trigger={burstCount} />

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: isShaking ? [0, -10, 10, -10, 10, 0] : 0,
        }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl mx-auto space-y-6 glass-card p-8 sm:p-12 rounded-3xl border border-[#F4B8C9]/30 bg-[#22171E]/95 shadow-2xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8C97A]/15 border border-[#E8C97A]/30 text-[#E8C97A] text-xs font-sans tracking-widest uppercase">
          <Sparkles size={14} />
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>

        <h2
          className="text-3xl sm:text-4xl font-light text-[#FFFCF9] leading-snug"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {currentQ.question_text || `A question for you, ${partnerName} ❤️`}
        </h2>

        {revealText ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-[#B83B5E]/25 border border-[#F4B8C9]/40 text-[#F4B8C9] text-base font-sans font-medium"
          >
            {revealText}
          </motion.div>
        ) : (
          <div className="relative pt-6 min-h-[140px] flex flex-col items-center justify-center">
            {/* Sliding Arrow Indicator pointing playfully toward the NO button */}
            {isEscape && dodgeCount === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  y: [0, -6, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-3 right-12 sm:right-20 flex items-center gap-1.5 text-xs text-[#E8C97A] font-sans font-medium pointer-events-none"
              >
                <span>Try saying no... 😉</span>
                <span className="text-base">↴</span>
              </motion.div>
            )}

            {dodgeCount > 0 && dodgeCount < 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[11px] font-sans text-[#F4B8C9] italic mb-3"
              >
                {dodgeCount === 1 && "Oops! It slipped away... 👀"}
                {dodgeCount === 2 && "Nice try, but you can't say no! 😂"}
                {dodgeCount >= 3 && "There is only one true answer ❤️"}
              </motion.div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-5 relative z-10">
              {/* Yes Button (Always easy to click) */}
              <motion.button
                type="button"
                animate={{ scale: yesScale }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                onClick={handleYes}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B83B5E] to-[#E98DA3] text-white font-sans text-sm font-semibold shadow-lg hover:shadow-[#B83B5E]/50 transition-shadow cursor-pointer flex items-center gap-2"
              >
                <Heart size={16} className="fill-white" />
                <span>{currentQ.yes_text || 'Yes ❤️'}</span>
              </motion.button>

              {/* No Button with Spring Escape Physics */}
              <motion.button
                type="button"
                animate={{ x: noOffset.x, y: noOffset.y }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onMouseEnter={handleNoInteraction}
                onTouchStart={handleNoInteraction}
                onClick={handleNoInteraction}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-[#9C8490] hover:text-white font-sans text-sm font-medium transition-colors cursor-pointer select-none"
              >
                <span>{currentQ.no_text || 'No 😂'}</span>
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
