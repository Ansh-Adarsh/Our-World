/**
 * CandleCake — the cake at the centre of the birthday surprise.
 *
 * Presentational only: the parent owns which candles are still lit, so a tap and
 * a breath into the microphone both drive the same single source of truth.
 *
 * Every candle is its own button. Tapping always works — the microphone is a
 * bonus, never a requirement, and is never requested on the user's behalf.
 */
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface CandleCakeProps {
  /** One entry per candle: true while still burning. */
  litFlags: boolean[];
  onTapCandle: (index: number) => void;
  /** False once the wish is made — the candles stop responding. */
  interactive?: boolean;
}

export function CandleCake({ litFlags, onTapCandle, interactive = true }: CandleCakeProps) {
  const reduceMotion = useReducedMotion();
  const count = litFlags.length;
  const anyLit = litFlags.some(Boolean);

  // Centre the candles across the top tier (x 76 → 164).
  const spacing = count > 1 ? Math.min(24, 80 / (count - 1)) : 0;
  const startX = 120 - (spacing * (count - 1)) / 2;

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[380px]">
      {/* Warm light the candles cast on the room */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[6%] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          width: '78%',
          height: '58%',
          background: 'radial-gradient(circle, rgba(232,201,122,0.55) 0%, rgba(184,59,94,0.16) 55%, transparent 75%)',
        }}
        animate={
          anyLit && !reduceMotion
            ? { opacity: [0.62, 0.9, 0.62], scale: [1, 1.05, 1] }
            : { opacity: anyLit ? 0.7 : 0.12 }
        }
        transition={anyLit && !reduceMotion ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 1.4 }}
      />

      <svg
        viewBox="0 0 240 205"
        className="relative w-full drop-shadow-[0_18px_38px_rgba(90,36,53,0.55)]"
        role="img"
        aria-label={
          anyLit
            ? `A birthday cake with ${litFlags.filter(Boolean).length} lit candle${
                litFlags.filter(Boolean).length === 1 ? '' : 's'
              }`
            : 'A birthday cake, candles blown out'
        }
      >
        <defs>
          <linearGradient id="tierA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B83B5E" />
            <stop offset="100%" stopColor="#7C2340" />
          </linearGradient>
          <linearGradient id="tierB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D45C7B" />
            <stop offset="100%" stopColor="#9E2F4E" />
          </linearGradient>
          <linearGradient id="frosting" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF8F2" />
            <stop offset="100%" stopColor="#F6D9DF" />
          </linearGradient>
          <radialGradient id="flameGlow">
            <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#E8C97A" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Plate */}
        <ellipse cx="120" cy="190" rx="102" ry="11" fill="#1A1015" opacity="0.85" />
        <ellipse cx="120" cy="187" rx="98" ry="9" fill="#2E2028" />
        <ellipse cx="120" cy="185" rx="86" ry="6" fill="#3A2831" />

        {/* Bottom tier */}
        <rect x="42" y="130" width="156" height="52" rx="9" fill="url(#tierA)" />
        <path
          d="M42 137c10 0 12 9 22 9s12-9 22-9 12 9 22 9 12-9 22-9 12 9 22 9 12-9 22-9 12 9 24 9v-9a9 9 0 0 0-9-9H51a9 9 0 0 0-9 9z"
          fill="url(#frosting)"
          opacity="0.94"
        />

        {/* Middle tier */}
        <rect x="60" y="97" width="120" height="38" rx="8" fill="url(#tierB)" />
        <path
          d="M60 103c9 0 11 8 20 8s11-8 20-8 11 8 20 8 11-8 20-8 11 8 20 8 11-8 20-8v-6a8 8 0 0 0-8-8H68a8 8 0 0 0-8 8z"
          fill="url(#frosting)"
          opacity="0.9"
        />

        {/* Top tier */}
        <rect x="78" y="70" width="84" height="30" rx="7" fill="url(#tierA)" />
        <path
          d="M78 76c8 0 10 7 18 7s10-7 18-7 10 7 18 7 10-7 18-7 10 7 10 7v-6a7 7 0 0 0-7-7H85a7 7 0 0 0-7 7z"
          fill="url(#frosting)"
          opacity="0.92"
        />

        {/* Piped detail */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={`d1-${i}`} cx={56 + i * 26} cy={166} r="3" fill="#F6D9DF" opacity="0.55" />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={`d2-${i}`} cx={72 + i * 24} cy={124} r="2.4" fill="#F6D9DF" opacity="0.45" />
        ))}

        {/* Candles */}
        {litFlags.map((lit, i) => {
          const cx = startX + spacing * i;
          return (
            <Candle
              key={i}
              x={cx}
              lit={lit}
              index={i}
              interactive={interactive}
              reduceMotion={!!reduceMotion}
              onTap={() => onTapCandle(i)}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ─── One candle ────────────────────────────────────────────────────────────────

interface CandleProps {
  x: number;
  lit: boolean;
  index: number;
  interactive: boolean;
  reduceMotion: boolean;
  onTap: () => void;
}

const CANDLE_TOP = 40;
const WICK_TOP = CANDLE_TOP - 4;

function Candle({ x, lit, index, interactive, reduceMotion, onTap }: CandleProps) {
  return (
    <g>
      {/* Candle body */}
      <rect x={x - 3} y={CANDLE_TOP} width="6" height="32" rx="3" fill="#FFF8F2" />
      <rect x={x - 3} y={CANDLE_TOP} width="3" height="32" rx="1.5" fill="#E98DA3" opacity="0.45" />
      {/* Wick */}
      <rect x={x - 0.7} y={WICK_TOP} width="1.4" height="5" rx="0.7" fill="#3D1624" />

      {/* Flame */}
      <AnimatePresence>
        {lit && (
          <motion.g
            key="flame"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.2, y: -4 }}
            transition={{ duration: 0.35 }}
            style={{ originX: `${x}px`, originY: `${WICK_TOP}px` }}
          >
            <circle cx={x} cy={WICK_TOP - 5} r="13" fill="url(#flameGlow)" />
            <motion.g
              animate={
                reduceMotion
                  ? undefined
                  : { scaleY: [1, 1.16, 0.94, 1.08, 1], x: [0, 0.7, -0.6, 0.4, 0] }
              }
              transition={{ duration: 1.5 + index * 0.17, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: `${x}px ${WICK_TOP}px` }}
            >
              <path
                d={`M${x} ${WICK_TOP - 13} C${x + 5} ${WICK_TOP - 6}, ${x + 4} ${WICK_TOP}, ${x} ${WICK_TOP} C${x - 4} ${WICK_TOP}, ${x - 5} ${WICK_TOP - 6}, ${x} ${WICK_TOP - 13}Z`}
                fill="#E8C97A"
              />
              <path
                d={`M${x} ${WICK_TOP - 8} C${x + 2.6} ${WICK_TOP - 4}, ${x + 2} ${WICK_TOP - 1}, ${x} ${WICK_TOP - 1} C${x - 2} ${WICK_TOP - 1}, ${x - 2.6} ${WICK_TOP - 4}, ${x} ${WICK_TOP - 8}Z`}
                fill="#FFFCF9"
                opacity="0.9"
              />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Smoke wisp, once, as it goes out */}
      <AnimatePresence>
        {!lit && (
          <motion.path
            key="smoke"
            d={`M${x} ${WICK_TOP - 2} c3 -5 -3 -9 0 -14 c3 -5 -2 -9 0 -13`}
            stroke="#FFF8F2"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            initial={{ opacity: 0.55, y: 0, scale: 0.7 }}
            animate={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -22, scale: 1.3 }}
            transition={{ duration: reduceMotion ? 0.6 : 1.9, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Hit target — generous, and a real button for keyboard users */}
      {interactive && lit && (
        <rect
          x={x - 13}
          y={WICK_TOP - 20}
          width="26"
          height="54"
          fill="transparent"
          className="cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B83B5E]"
          role="button"
          tabIndex={0}
          aria-label={`Blow out candle ${index + 1}`}
          onClick={onTap}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTap();
            }
          }}
        />
      )}
    </g>
  );
}
