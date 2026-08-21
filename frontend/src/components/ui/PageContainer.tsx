/**
 * PageContainer — the shared full-page layout wrapper for all protected pages.
 *
 * Two-layer architecture:
 *  • Outer div — covers the full viewport with the background color/gradient
 *  • Inner div — centers content at a comfortable reading/viewing width
 *
 * The max-w-7xl (1280px) + mx-auto combination means:
 *  • Mobile / Tablet: content fills available width (px-5 / px-8 padding)
 *  • Laptop (1280px): content fills the screen with lg:px-10 padding
 *  • Desktop (1440px): 80px balanced margins on each side — visually centered
 *  • Large (1920px+): wide balanced margins — elegant and readable
 */
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
    <div className="w-full flex justify-center">
      <div
        className={[
          'w-full max-w-7xl',
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
