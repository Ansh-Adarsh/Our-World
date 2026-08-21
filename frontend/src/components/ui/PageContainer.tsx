/**
 * PageContainer — the shared full-page layout wrapper for all protected pages.
 *
 * Two-layer architecture:
 *  • Outer div — covers the full viewport with ambient subtle floral accents
 *  • Inner div — centers content at a comfortable reading/viewing width
 *
 * Sizing rules:
 *  • Mobile / Tablet: content fills available width (px-4 / px-6 padding)
 *  • Laptop (1280px): content fills screen with lg:px-10 padding
 *  • Desktop (1440px): 80px balanced margins on each side
 *  • Large (1920px+): elegant, readable centered container
 */
import React from 'react';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noBottomPad?: boolean;
}

export function PageContainer({
  children,
  className = '',
  noBottomPad = false,
}: PageContainerProps) {
  return (
    <div className="relative w-full min-h-dvh flex justify-center overflow-x-hidden">
      {/* Subtle, non-intrusive ambient background floral accents */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        {/* Soft atmospheric gradient blurs */}
        <div className="absolute -top-20 -right-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#B83B5E]/[0.07] blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 sm:w-88 h-72 sm:h-88 rounded-full bg-[#E8C97A]/[0.05] blur-3xl" />

        {/* Delicate botanical perimeter silhouettes (desktop/tablet) */}
        <div className="hidden sm:block absolute top-8 right-8 opacity-25">
          <FlowerAccent variant="sakura" size={72} color="#F4B8C9" delay={0.2} />
        </div>
        <div className="hidden lg:block absolute bottom-12 left-8 opacity-20">
          <FlowerAccent variant="bud" size={64} color="#E8C97A" delay={0.4} />
        </div>
      </div>

      {/* Main Content Viewport Layer */}
      <div
        className={[
          'relative z-10 w-full max-w-7xl',
          'px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12',
          'py-6 sm:py-8 lg:py-10',
          noBottomPad ? 'pb-4' : 'pb-12 sm:pb-16',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
