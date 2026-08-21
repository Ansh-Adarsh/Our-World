import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { HeartBurst } from '@/components/journey/JourneyParticles';
import { playUnlock, playPuff } from '@/utils/sound';
import type { SurpriseQuestion } from '@/types';

interface SceneQuestionsProps {
  questions: SurpriseQuestion[];
  partnerName: string;
  onNext: () => void;
}

export function SceneQuestions({ questions, partnerName, onNext }: SceneQuestionsProps) {
  const reduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noOffset, setNoOffset] = useState({ x: 0, y: 0 });
  const [yesScale, setYesScale] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [revealText, setRevealText] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);
  const [dodgeCount, setDodgeCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const isCooldownRef = useRef(false);

  if (!questions || questions.length === 0) {
    onNext();
    return null;
  }

  const currentQ = questions[currentIndex];
  const isEscape = currentQ.no_button_behavior === 'escape' || !currentQ.no_button_behavior;
  const isLastQuestion = currentIndex === questions.length - 1;

  // Reset coordinates and state when changing question
  useEffect(() => {
    setNoOffset({ x: 0, y: 0 });
    setYesScale(1);
    setDodgeCount(0);
    setRevealText(null);
  }, [currentIndex]);

  /**
   * Calculates vector away from pointer and moves NO button within safe bounds
   */
  const triggerEscape = useCallback(
    (pointerX: number, pointerY: number) => {
      if (!isEscape || isCooldownRef.current || !noButtonRef.current || !containerRef.current) {
        return;
      }

      const noBtnRect = noButtonRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const btnCenterX = noBtnRect.left + noBtnRect.width / 2;
      const btnCenterY = noBtnRect.top + noBtnRect.height / 2;

      // Vector from pointer to button center
      let dx = btnCenterX - pointerX;
      let dy = btnCenterY - pointerY;
      const dist = Math.hypot(dx, dy);

      // Trigger threshold: 95px on desktop, 70px on smaller screens
      const threshold = window.innerWidth < 640 ? 75 : 95;
      if (dist > threshold) {
        return;
      }

      // Enter cooldown lock so movement is smooth and doesn't thrash
      isCooldownRef.current = true;
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 240);

      // Normalize escape direction vector
      let normX = dx / (dist || 1);
      let normY = dy / (dist || 1);

      // Add a slight playful perpendicular curve (tangent)
      const tangentFactor = (Math.random() - 0.5) * 0.45;
      const curvedX = normX - normY * tangentFactor;
      const curvedY = normY + normX * tangentFactor;
      const curvedLen = Math.hypot(curvedX, curvedY) || 1;
      const dirX = curvedX / curvedLen;
      const dirY = curvedY / curvedLen;

      // Escape distance step
      const step = window.innerWidth < 640 ? 95 : 125;

      setNoOffset((prev) => {
        let candidateX = prev.x + dirX * step;
        let candidateY = prev.y + dirY * step;

        // Calculate safe boundaries inside the card container
        const maxBoundX = Math.min((containerRect.width / 2) - 45, 140);
        const minBoundX = -maxBoundX;
        const maxBoundY = 55;
        const minBoundY = -55;

        // Bounce back if target exceeds boundaries
        if (candidateX > maxBoundX) {
          candidateX = minBoundX + 25 + Math.random() * 20;
        } else if (candidateX < minBoundX) {
          candidateX = maxBoundX - 25 - Math.random() * 20;
        }

        if (candidateY > maxBoundY) {
          candidateY = minBoundY + 15 + Math.random() * 15;
        } else if (candidateY < minBoundY) {
          candidateY = maxBoundY - 15 - Math.random() * 15;
        }

        return { x: candidateX, y: candidateY };
      });

      setDodgeCount((c) => c + 1);
      setYesScale((prev) => Math.min(prev + 0.1, 1.6));
      playPuff(true);
    },
    [isEscape]
  );

  // Desktop Pointer Tracking
  useEffect(() => {
    if (!isEscape) return;

    const handlePointerMove = (e: PointerEvent) => {
      triggerEscape(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isEscape, triggerEscape]);

  // Mobile Touch Proximity
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      triggerEscape(touch.clientX, touch.clientY);
    }
  };

  const handleNoClick = (e: React.MouseEvent) => {
    if (isEscape) {
      e.preventDefault();
      triggerEscape(e.clientX, e.clientY);
    } else if (currentQ.no_button_behavior === 'grow_yes') {
      setYesScale((prev) => Math.min(prev + 0.2, 2.0));
      playPuff(true);
    } else if (currentQ.no_button_behavior === 'shake') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      playPuff(true);
    } else {
      // Normal button behavior
      setRevealText(currentQ.reveal_message || 'Thank you for your honesty ❤️');
      setTimeout(() => {
        setRevealText(null);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          onNext();
        }
      }, 1500);
    }
  };

  const handleYes = () => {
    playUnlock(true);
    setBurstCount((c) => c + 1);
    setRevealText(currentQ.reveal_message || 'I knew it... ❤️');

    const timeoutDuration = isLastQuestion ? 2400 : 1800;

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
    }, timeoutDuration);
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B83B5E]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C9A45C]/15 rounded-full blur-3xl" />
      </div>

      <HeartBurst trigger={burstCount} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: isShaking ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          exit={{ opacity: 0, scale: 0.94, y: -16 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-xl mx-auto space-y-6 glass-card p-8 sm:p-12 rounded-3xl border border-[#F4B8C9]/30 bg-[#22171E]/95 shadow-2xl"
        >
          {/* Elegant Storytelling Badge (Clean, No Technical step numbers) */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E8C97A]/15 border border-[#E8C97A]/30 text-[#E8C97A] text-xs font-sans tracking-widest uppercase">
            <span>🌸</span>
            <span>A Story of Us</span>
          </div>

          <h2
            className="text-2xl sm:text-4xl font-light text-[#FFFCF9] leading-relaxed whitespace-pre-line"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {currentQ.question_text || `A question for you, ${partnerName} ❤️`}
          </h2>

          {revealText ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-2xl bg-[#B83B5E]/25 border border-[#F4B8C9]/40 text-[#F4B8C9] text-base sm:text-lg font-sans font-medium whitespace-pre-line leading-relaxed shadow-lg"
            >
              {revealText}
            </motion.div>
          ) : (
            <div
              ref={containerRef}
              className="relative pt-8 min-h-[170px] flex flex-col items-center justify-center overflow-visible"
            >
              {/* Dynamic Animated Arrow Indicator that tracks the NO button position */}
              {isEscape && (
                <motion.div
                  animate={
                    reduceMotion
                      ? { x: noOffset.x, y: noOffset.y - 34 }
                      : {
                          x: noOffset.x,
                          y: [noOffset.y - 38, noOffset.y - 30, noOffset.y - 38],
                        }
                  }
                  transition={{
                    x: { type: 'spring', stiffness: 350, damping: 25 },
                    y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="absolute flex items-center justify-center gap-1.5 text-xs text-[#E8C97A] font-sans font-medium pointer-events-none z-30"
                >
                  <span>{dodgeCount === 0 ? 'Try saying no... 😉' : 'Catch me if you can! 🏃'}</span>
                  <span className="text-base">↴</span>
                </motion.div>
              )}

              {dodgeCount > 0 && dodgeCount < 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[11px] font-sans text-[#F4B8C9] italic mb-3 absolute top-0"
                >
                  {dodgeCount === 1 && "Oops! It slipped away... 👀"}
                  {dodgeCount === 2 && "Nice try, but you can't say no! 😂"}
                  {dodgeCount === 3 && "Almost got it! Try again... 💨"}
                  {dodgeCount >= 4 && "There is only one true answer ❤️"}
                </motion.div>
              )}

              {/* Controlled Interaction Area — YES is stationary, NO moves within safe bounds */}
              <div className="flex flex-wrap items-center justify-center gap-5 relative z-10 w-full">
                {/* YES Button (Stationary & Always Easy to Click) */}
                <motion.button
                  type="button"
                  animate={{ scale: yesScale }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  onClick={handleYes}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B83B5E] to-[#E98DA3] text-white font-sans text-sm font-semibold shadow-lg hover:shadow-[#B83B5E]/50 transition-shadow cursor-pointer flex items-center gap-2 select-none"
                >
                  <Heart size={16} className="fill-white" />
                  <span>{currentQ.yes_text || 'YES ❤️'}</span>
                </motion.button>

                {/* NO Button (Playful Proximity Evasion) */}
                <motion.button
                  ref={noButtonRef}
                  type="button"
                  animate={
                    reduceMotion
                      ? { x: noOffset.x, y: noOffset.y }
                      : { x: noOffset.x, y: noOffset.y }
                  }
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  onTouchStart={handleTouchStart}
                  onClick={handleNoClick}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-[#9C8490] hover:text-white font-sans text-sm font-medium transition-colors cursor-pointer select-none relative z-20"
                >
                  <span>{currentQ.no_text || 'NO 😏'}</span>
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
