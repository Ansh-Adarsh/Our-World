/**
 * JourneyBackdrop — the shared romantic stage for every journey screen.
 *
 * One backdrop for onboarding, the birthday surprise and the memories chapter,
 * so the three read as one continuous evening rather than three pages. Layers,
 * back to front: gradient ground, two soft glows, drifting petals, vignette.
 *
 * `dim` is what the gateway transition animates — the whole stage darkens before
 * the door opens.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { FloatingPetals } from '@/components/flowers/FlowerAccent';

interface JourneyBackdropProps {
  /** 'calm' for questions, 'warm' for the birthday, 'night' for transitions. */
  mood?: 'calm' | 'warm' | 'night';
  /** Darken everything — used while a scene changes. */
  dim?: boolean;
  /** Petals drift by default; turn them off for dense content like the gallery. */
  petals?: boolean;
}

const MOODS = {
  calm: {
    base: 'linear-gradient(160deg, #241B20 0%, #1A1015 55%, #2C1420 100%)',
    glowA: 'rgba(184, 59, 94, 0.16)',
    glowB: 'rgba(90, 36, 53, 0.32)',
    petal: '#E98DA3',
  },
  warm: {
    base: 'linear-gradient(165deg, #2E1620 0%, #1E1017 50%, #3A1526 100%)',
    glowA: 'rgba(201, 164, 92, 0.14)',
    glowB: 'rgba(184, 59, 94, 0.26)',
    petal: '#E8C97A',
  },
  night: {
    base: 'linear-gradient(170deg, #150D11 0%, #100A0D 60%, #1D0F16 100%)',
    glowA: 'rgba(184, 59, 94, 0.10)',
    glowB: 'rgba(90, 36, 53, 0.20)',
    petal: '#B83B5E',
  },
} as const;

export function JourneyBackdrop({ mood = 'calm', dim = false, petals = true }: JourneyBackdropProps) {
  const reduceMotion = useReducedMotion();
  const theme = MOODS[mood];

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Gradient ground */}
      <div className="absolute inset-0" style={{ background: theme.base }} />

      {/* Two soft glows, slowly breathing */}
      <motion.div
        className="absolute -top-24 right-[-10%] h-[28rem] w-[28rem] rounded-full blur-3xl sm:h-[34rem] sm:w-[34rem]"
        style={{ background: theme.glowA }}
        animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[-12%] h-[26rem] w-[26rem] rounded-full blur-3xl sm:h-[32rem] sm:w-[32rem]"
        style={{ background: theme.glowB }}
        animate={reduceMotion ? undefined : { scale: [1.06, 1, 1.06], opacity: [0.7, 0.95, 0.7] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {petals && !reduceMotion && <FloatingPetals color={theme.petal} />}

      {/* Vignette keeps the centre of the stage brightest */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(10, 6, 8, 0.55) 100%)',
        }}
      />

      {/* Scene-change dimmer */}
      <motion.div
        className="absolute inset-0 bg-[#0A0608]"
        initial={false}
        animate={{ opacity: dim ? 0.82 : 0 }}
        transition={{ duration: reduceMotion ? 0.15 : 1.1, ease: 'easeInOut' }}
      />
    </div>
  );
}
