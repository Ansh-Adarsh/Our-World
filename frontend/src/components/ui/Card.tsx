import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  variant?: 'dark' | 'light' | 'gold';
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'dark', className = '', animate = false, onClick }, ref) => {
    const variantClass = {
      dark: 'glass-card',
      light: 'glass-card-light',
      gold: [
        'glass-card',
        'border-[#C9A45C]/20',
        'shadow-[0_8px_32px_rgba(201,164,92,0.1)]',
      ].join(' '),
    }[variant];

    const inner = (
      <div
        ref={ref}
        className={[
          variantClass,
          'p-6',
          onClick ? 'cursor-pointer' : '',
          className,
        ].join(' ')}
        onClick={onClick}
      >
        {children}
      </div>
    );

    if (animate) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {inner}
        </motion.div>
      );
    }

    return inner;
  }
);

Card.displayName = 'Card';
