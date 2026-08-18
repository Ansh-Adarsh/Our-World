/**
 * Journey particles — hearts, petals and confetti.
 *
 * Both components are purely decorative: they render nothing at all when the
 * viewer prefers reduced motion, and every screen that uses them also states
 * its outcome in text, so nothing is ever communicated by motion alone.
 *
 * Replay by incrementing `trigger` — a change in the key restarts the burst.
 */
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const PALETTE = ['#E98DA3', '#B83B5E', '#C9A45C', '#E8C97A', '#FFFCF9'];

function HeartShape({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 21s-7.5-4.9-9.3-9.2C1.2 8.3 3.2 5 6.5 5c2 0 3.4 1.1 4.2 2.3l1.3 1.9 1.3-1.9C14.1 6.1 15.5 5 17.5 5c3.3 0 5.3 3.3 3.8 6.8C19.5 16.1 12 21 12 21z" />
    </svg>
  );
}

function PetalShape({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size * 0.65} height={size} viewBox="0 0 30 50" fill={color} aria-hidden="true">
      <ellipse cx="15" cy="25" rx="11" ry="22" />
    </svg>
  );
}

// Deterministic scatter — same burst every time, no random jitter to debug.
function scatter(i: number, count: number) {
  const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.4;
  const distance = 80 + ((i * 47) % 130);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 50,
    rotate: ((i * 61) % 90) - 45,
    size: 12 + ((i * 13) % 14),
    color: PALETTE[i % PALETTE.length],
    delay: (i % 5) * 0.045,
  };
}

interface HeartBurstProps {
  /** Increment to replay. 0 renders nothing. */
  trigger: number;
  count?: number;
}

/** A short bloom of hearts and petals — used when an answer lands. */
export function HeartBurst({ trigger, count = 14 }: HeartBurstProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || trigger <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
      <AnimatePresence>
        <div key={trigger} className="absolute left-1/2 top-1/2">
          {Array.from({ length: count }, (_, i) => {
            const p = scatter(i, count);
            return (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0.2, 1, 0.85],
                  opacity: [0, 1, 0],
                  rotate: p.rotate,
                }}
                transition={{ duration: 1.5, delay: p.delay, ease: [0.22, 0.8, 0.3, 1] }}
              >
                {i % 3 === 0 ? (
                  <PetalShape size={p.size} color={p.color} />
                ) : (
                  <HeartShape size={p.size} color={p.color} />
                )}
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}

interface CelebrationProps {
  /** Increment to replay. 0 renders nothing. */
  trigger: number;
  pieces?: number;
}

/**
 * The bigger moment: confetti and hearts falling across the whole screen, once,
 * after the candles go out.
 */
export function Celebration({ trigger, pieces = 34 }: CelebrationProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || trigger <= 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        <div key={trigger} className="absolute inset-0">
          {Array.from({ length: pieces }, (_, i) => {
            const left = ((i * 97) % 100) + ((i % 3) - 1) * 1.5;
            const size = 10 + ((i * 17) % 12);
            const color = PALETTE[i % PALETTE.length];
            const delay = ((i * 29) % 100) / 100;
            const drift = (((i * 53) % 60) - 30) * 1.4;

            return (
              <motion.div
                key={i}
                className="absolute top-[-8%]"
                style={{ left: `${Math.max(1, Math.min(98, left))}%` }}
                initial={{ y: 0, x: 0, opacity: 0, rotate: 0 }}
                animate={{
                  y: ['0vh', '108vh'],
                  x: [0, drift, -drift * 0.5, drift * 0.3],
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 180, 320],
                }}
                transition={{ duration: 3.6 + (i % 4) * 0.5, delay, ease: 'easeIn' }}
              >
                {i % 4 === 0 ? (
                  <HeartShape size={size} color={color} />
                ) : i % 4 === 1 ? (
                  <PetalShape size={size} color={color} />
                ) : (
                  <div
                    style={{
                      width: size * 0.35,
                      height: size,
                      background: color,
                      borderRadius: 2,
                      opacity: 0.85,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
