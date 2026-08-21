/**
 * FlowerAccent — decorative SVG flower/petal elements.
 * Used sparingly as background accents, not as decoration spam.
 * Each instance is gently animated with the gentle-float keyframe.
 */
import { motion } from 'framer-motion';

interface FlowerAccentProps {
  variant?: 'rose' | 'sakura' | 'peony' | 'petal' | 'bud' | 'leaf';
  size?: number;
  color?: string;
  className?: string;
  animate?: boolean;
  delay?: number;
  opacity?: number;
}

export function FlowerAccent({
  variant = 'sakura',
  size = 40,
  color = '#F4B8C9',
  className = '',
  animate = true,
  delay = 0,
  opacity = 0.65,
}: FlowerAccentProps) {
  const svgProps = { width: size, height: size, fill: color, opacity };

  const shapes: Record<string, React.ReactNode> = {
    sakura: (
      <svg width={size} height={size} viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <g transform="translate(25, 25)">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <path
              key={i}
              d="M 0 0 C -6 -14, -8 -22, -3 -24 C 0 -22, 0 -22, 3 -24 C 8 -22, 6 -14, 0 0"
              fill={color}
              transform={`rotate(${angle})`}
            />
          ))}
          {/* Flower Center Stamen & Pistils */}
          <circle cx="0" cy="0" r="4.5" fill="#E8C97A" opacity="0.9" />
          <circle cx="0" cy="0" r="2" fill="#B83B5E" opacity="0.8" />
        </g>
      </svg>
    ),

    rose: (
      <svg width={size} height={size} viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <g transform="translate(25, 25)">
          <circle cx="0" cy="0" r="18" fill={color} opacity="0.25" />
          <ellipse cx="0" cy="-6" rx="9" ry="12" fill={color} opacity="0.6" />
          <ellipse cx="6" cy="2" rx="12" ry="8" fill={color} opacity="0.6" transform="rotate(45)" />
          <ellipse cx="-4" cy="5" rx="11" ry="8" fill={color} opacity="0.7" transform="rotate(-35)" />
          <circle cx="0" cy="0" r="6" fill="#B83B5E" opacity="0.8" />
          <circle cx="0" cy="0" r="3" fill="#E8C97A" opacity="0.9" />
        </g>
      </svg>
    ),

    peony: (
      <svg width={size} height={size} viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <g transform="translate(25, 25)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <ellipse
              key={i}
              cx="0"
              cy="-13"
              rx="6"
              ry="10"
              fill={color}
              opacity="0.45"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="7" fill="#E8C97A" opacity="0.85" />
        </g>
      </svg>
    ),

    petal: (
      <svg {...svgProps} viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M15,5 C5,15 2,30 15,45 C28,30 25,15 15,5 Z" fill={color} />
      </svg>
    ),

    bud: (
      <svg {...svgProps} viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="15" cy="20" rx="8" ry="16" fill={color} />
        <ellipse cx="15" cy="26" rx="8" ry="10" fill="#B83B5E" opacity="0.5" />
      </svg>
    ),

    leaf: (
      <svg {...svgProps} viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="15" cy="25" rx="10" ry="22" fill={color} opacity={opacity} />
        <line x1="15" y1="5" x2="15" y2="45" stroke="#E8C97A" strokeWidth="1" opacity="0.4" />
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

export function FloatingPetals({ color = '#F4B8C9' }: FloatingPetalsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {PETALS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 pointer-events-none"
          style={{ left: p.left }}
          initial={{ y: '100vh', rotate: 0, opacity: 0 }}
          animate={{
            y: '-120vh',
            rotate: [0, 45, -30, 60, 0],
            x: [0, 25, -20, 30, 0],
            opacity: [0, p.opacity, p.opacity * 0.85, 0],
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
            height={p.size * 1.5}
            viewBox="0 0 30 45"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15,2 C7,12 3,25 15,42 C27,25 23,12 15,2 Z"
              fill={color}
              opacity={0.8}
            />
            {/* Delicate petal vein */}
            <path
              d="M15,8 Q15,24 15,36"
              stroke="#FFF"
              strokeWidth="0.8"
              opacity="0.3"
              fill="none"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
