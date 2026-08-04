import { forwardRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, rightElement, className = '', ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = !!props.value || !!props.defaultValue;

    return (
      <div className="relative w-full flex flex-col">
        <div className="relative w-full h-14">
          <input
            ref={ref}
            id={id}
            className={[
              'peer w-full h-full pl-4 pt-5 pb-1',
              rightElement ? 'pr-12' : 'pr-4',
              'bg-white/5 border rounded-xl',
              'text-[#FFFCF9] text-base font-sans font-normal',
              'placeholder-transparent',
              'outline-none',
              'transition-all duration-200',
              error
                ? 'border-red-400/60 focus:border-red-400'
                : 'border-[#E98DA3]/20 focus:border-[#B83B5E]/60',
              'focus:bg-white/10',
              className,
            ].join(' ')}
            placeholder={label}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />

          {/* Floating Label */}
          <label
            htmlFor={id}
            className={[
              'absolute left-4 font-sans pointer-events-none select-none',
              'transition-all duration-200 ease-out',
              focused || hasValue || props.value
                ? 'top-1.5 text-[11px] font-medium text-[#E98DA3]/80 tracking-wide'
                : 'top-4 text-sm font-normal text-[#9C8490]',
            ].join(' ')}
          >
            {label}
          </label>

          {/* Right Element (e.g. Eye icon toggle) */}
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1 text-xs text-red-400 font-sans">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
