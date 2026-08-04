interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={[
        sizeMap[size],
        'border-2 border-[#E98DA3]/20 border-t-[#B83B5E]',
        'rounded-full animate-spin',
        className,
      ].join(' ')}
    />
  );
}
