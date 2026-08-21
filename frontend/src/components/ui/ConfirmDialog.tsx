import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/25 bg-gradient-to-b from-[#2E2028]/95 to-[#241B20]/95 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    isDestructive
                      ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                      : 'bg-[#E8C97A]/15 border border-[#E8C97A]/30 text-[#E8C97A]'
                  }`}
                >
                  {isDestructive ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
                </div>
                <h3
                  className="text-xl sm:text-2xl font-light text-[#FFFCF9]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {title}
                </h3>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="text-[#9C8490] hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm font-sans text-[#9C8490] leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-sans text-[#9C8490] hover:text-white"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={isDestructive ? 'danger' : 'primary'}
                onClick={onConfirm}
                isLoading={isLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-sans font-semibold shadow-lg"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
