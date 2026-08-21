import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import type { ButtonVariant, ButtonSize } from '@/types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#B83B5E] text-[#FFFCF9]',
    'border border-[#B83B5E]',
    'hover:bg-[#9E2F4E] hover:border-[#9E2F4E]',
    'shadow-lg shadow-[#B83B5E]/25',
  ].join(' '),

  ghost: [
    'bg-transparent text-[#E98DA3]',
    'border border-[#E98DA3]/30',
    'hover:bg-[#E98DA3]/10 hover:border-[#E98DA3]/60',
  ].join(' '),

  gold: [
    'bg-transparent text-[#C9A45C]',
    'border border-[#C9A45C]/40',
    'hover:bg-[#C9A45C]/15 hover:border-[#C9A45C]/70',
    'shadow-sm shadow-[#C9A45C]/15',
  ].join(' '),

  danger: [
    'bg-transparent text-red-400',
    'border border-red-400/30',
    'hover:bg-red-400/10 hover:border-red-400/60',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, children, className = '', disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={[
          'relative inline-flex items-center justify-center gap-2',
          'font-sans font-medium tracking-wide whitespace-nowrap shrink-0',
          'rounded-[0.75rem]',
          'transition-all duration-200',
          'cursor-pointer select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
        disabled={disabled || isLoading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        <span className={`inline-flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
