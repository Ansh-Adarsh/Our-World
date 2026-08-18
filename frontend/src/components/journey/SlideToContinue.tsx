/**
 * SlideToContinue — the journey's forward gesture.
 *
 * A drag rather than a tap, because advancing through someone's story should
 * take a small deliberate movement. The arrow only unlocks once the current
 * answer is accepted, which is what makes the question game feel like a series
 * of little doors.
 *
 * Accessibility: this is a real button underneath. Enter or Space completes it
 * without any dragging, it takes focus in tab order, and when the viewer prefers
 * reduced motion the idle shimmer and bounce are dropped while the control keeps
 * working exactly the same way.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';

const KNOB = 52;
const PAD = 4;
/** Fraction of the track that counts as "committed". */
const THRESHOLD = 0.55;

interface SlideToContinueProps {
  onComplete: () => void;
  /** Locked until the answer is accepted. */
  disabled?: boolean;
  label?: string;
  lockedLabel?: string;
  /** Changing this snaps the knob home — pass the question id. */
  resetKey?: string | number;
}

export function SlideToContinue({
  onComplete,
  disabled = false,
  label = 'Slide to continue',
  lockedLabel = 'Answer to unlock',
  resetKey,
}: SlideToContinueProps) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);
  const [committed, setCommitted] = useState(false);
  const x = useMotionValue(0);

  // Measure the travel distance, and keep it right through orientation changes.
  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (el) setMaxX(Math.max(0, el.offsetWidth - KNOB - PAD * 2));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // New question, or the answer changed back to wrong: bring the knob home.
  useEffect(() => {
    setCommitted(false);
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
  }, [resetKey, disabled, x]);

  const fillWidth = useTransform(x, (v) => v + KNOB + PAD);
  const labelOpacity = useTransform(x, (v) => (maxX > 0 ? Math.max(0, 1 - v / (maxX * 0.45)) : 1));

  const complete = () => {
    if (disabled || committed) return;
    setCommitted(true);
    animate(x, maxX, { type: 'spring', stiffness: 320, damping: 30 });
    // Let the arrow land before the scene changes.
    window.setTimeout(onComplete, reduceMotion ? 60 : 260);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      complete();
    }
  };

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={disabled ? lockedLabel : `${label}. Press Enter to continue.`}
        onKeyDown={handleKeyDown}
        className={[
          'relative flex h-[60px] w-full items-center overflow-hidden rounded-full',
          'border transition-colors duration-300 select-none',
          disabled
            ? 'border-white/10 bg-white/[0.03] cursor-not-allowed'
            : 'border-[#E98DA3]/30 bg-[#1A1015]/70 cursor-grab active:cursor-grabbing',
        ].join(' ')}
        style={{ padding: PAD }}
      >
        {/* Progress fill trailing the knob */}
        {!disabled && (
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#B83B5E]/35 via-[#E98DA3]/25 to-transparent"
            style={{ width: fillWidth }}
          />
        )}

        {/* Track label */}
        <motion.span
          className={[
            'pointer-events-none absolute inset-0 flex items-center justify-center',
            'font-sans text-[13px] tracking-[0.18em] uppercase',
            disabled ? 'text-[#9C8490]/60' : 'text-[#E98DA3]/80',
          ].join(' ')}
          style={{ opacity: disabled ? 1 : labelOpacity }}
        >
          {disabled ? lockedLabel : label}
        </motion.span>

        {/* The knob */}
        <motion.div
          drag={disabled ? false : 'x'}
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0.04}
          dragMomentum={false}
          style={{ x, width: KNOB, height: KNOB }}
          onDragEnd={() => {
            if (x.get() >= maxX * THRESHOLD) complete();
            else animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
          }}
          animate={
            disabled || committed || reduceMotion
              ? undefined
              : { boxShadow: ['0 0 0 rgba(184,59,94,0)', '0 0 22px rgba(184,59,94,0.55)', '0 0 0 rgba(184,59,94,0)'] }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className={[
            'relative z-10 flex shrink-0 items-center justify-center rounded-full',
            disabled
              ? 'bg-white/[0.06] text-[#9C8490]/50'
              : 'bg-[#B83B5E] text-[#FFFCF9] shadow-lg shadow-[#B83B5E]/40',
          ].join(' ')}
        >
          {disabled ? (
            <Lock size={18} aria-hidden="true" />
          ) : (
            <motion.span
              animate={reduceMotion || committed ? undefined : { x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              <ArrowRight size={22} aria-hidden="true" />
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Keyboard affordance — the drag is never the only way through */}
      {!disabled && (
        <p className="mt-2 text-center font-sans text-[11px] tracking-wide text-[#9C8490]/60">
          or press Enter
        </p>
      )}
    </div>
  );
}
