/**
 * FlowerAccent — decorative SVG flower/petal elements.
 * Used sparingly as background accents, not as decoration spam.
 * Each instance is gently animated with the gentle-float keyframe.
 */
import { motion } from 'framer-motion';

interface FlowerAccentProps {
  variant?: 'rose' | 'petal' | 'bud' | 'leaf';
  size?: number;
  color?: string;
  className?: string;
  animate?: boolean;
  delay?: number;
  opacity?: number;
}

export function FlowerAccent({
  variant = 'rose',
  size = 40,
  color = '#E98DA3',
  className = '',
  animate = true,
  delay = 0,
  opacity = 0.4,
}: FlowerAccentProps) {
  const svgProps = { width: size, height: size, fill: color, opacity };

  const shapes: Record<string, React.ReactNode> = {
    rose: (
      <svg {...svgProps} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="14" rx="6" ry="10" />
        <ellipse cx="28" cy="20" rx="10" ry="6" transform="rotate(30 28 20)" />
        <ellipse cx="26" cy="30" rx="6" ry="10" transform="rotate(60 26 30)" />
        <ellipse cx="14" cy="30" rx="6" ry="10" transform="rotate(-60 14 30)" />
        <ellipse cx="12" cy="20" rx="10" ry="6" transform="rotate(-30 12 20)" />
        <circle cx="20" cy="20" r="5" opacity="0.8" />
      </svg>
    ),

    petal: (
      <svg {...svgProps} viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="15" cy="25" rx="11" ry="22" />
      </svg>
    ),

    bud: (
      <svg {...svgProps} viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="15" cy="20" rx="8" ry="16" />
        <ellipse cx="15" cy="26" rx="8" ry="10" opacity="0.5" />
      </svg>
    ),

    leaf: (
      <svg {...svgProps} viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="15" cy="25" rx="10" ry="22" fill={color} opacity={opacity} />
        <line x1="15" y1="5" x2="15" y2="45" stroke={color} strokeWidth="1" opacity="0.3" />
      </svg>
    ),
  };

  if (!animate) {
    return (
      <span className={className} style={{ display: 'inline-block' }}>
        {shapes[variant]}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block' }}
      animate={{
        y: [0, -10, -4, 0],
        rotate: [0, 3, -2, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {shapes[variant]}
    </motion.span>
  );
}

/**
 * FloatingPetals — renders multiple petals that float upward.
 * Used on the Landing page as a background effect.
 */
interface FloatingPetalConfig {
  left: string;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

const PETALS: FloatingPetalConfig[] = [
  { left: '10%', delay: 0,    duration: 12, size: 16, opacity: 0.3 },
  { left: '25%', delay: 2.5,  duration: 15, size: 20, opacity: 0.25 },
  { left: '45%', delay: 5,    duration: 11, size: 14, opacity: 0.35 },
  { left: '65%', delay: 1.5,  duration: 14, size: 18, opacity: 0.2 },
  { left: '80%', delay: 3.5,  duration: 13, size: 12, opacity: 0.3 },
  { left: '90%', delay: 7,    duration: 16, size: 22, opacity: 0.2 },
];

interface FloatingPetalsProps {
  color?: string;
}

export function FloatingPetals({ color = '#E98DA3' }: FloatingPetalsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {PETALS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{ left: p.left }}
          initial={{ y: '100vh', rotate: 0, opacity: 0 }}
          animate={{
            y: '-120vh',
            rotate: [0, 25, -15, 30, 0],
            x: [0, 20, -15, 25, 0],
            opacity: [0, p.opacity, p.opacity * 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg
            width={p.size}
            height={p.size * 1.6}
            viewBox="0 0 30 50"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="15" cy="25" rx="11" ry="22" fill={color} />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
