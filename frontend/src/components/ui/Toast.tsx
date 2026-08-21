import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-[#3D1624]/95 border-red-500/30 text-white'
                : toast.type === 'info'
                ? 'bg-[#2E2028]/95 border-[#E8C97A]/30 text-white'
                : 'bg-[#2E2028]/95 border-[#F4B8C9]/30 text-white'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? (
                <AlertCircle size={18} className="text-red-400" />
              ) : toast.type === 'info' ? (
                <Info size={18} className="text-[#E8C97A]" />
              ) : (
                <CheckCircle2 size={18} className="text-[#F4B8C9]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <p
                  className="text-sm font-medium text-[#FFFCF9] font-serif tracking-wide mb-0.5"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {toast.title}
                </p>
              )}
              <p className="text-xs text-[#E98DA3] font-sans leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#9C8490] hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
