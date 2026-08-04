import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, ImageIcon, Heart, MessageCircle, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

/**
 * AppShell — authenticated layout wrapper.
 * Renders the bottom navigation and wraps all protected pages.
 * Phase 1: navigation items are placeholders; routes added in later phases.
 */
export function AppShell() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-our-world">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="font-serif text-[#E98DA3]/60 text-sm tracking-widest uppercase">
            Loading your world...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 flex flex-col bg-our-world min-h-dvh">
      {/* Page content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-card rounded-none rounded-t-2xl border-b-0 px-6 py-3">
          <div className="flex items-center justify-around max-w-sm mx-auto">
            <NavItem icon={<Home size={20} />} label="Home" onClick={() => navigate('/home')} />
            <NavItem icon={<ImageIcon size={20} />} label="Memories" onClick={() => {}} disabled />
            {/* Center add button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-full bg-[#B83B5E] flex items-center justify-center shadow-lg shadow-[#B83B5E]/40 -mt-5 cursor-pointer"
              aria-label="Add new"
            >
              <Heart size={22} fill="white" color="white" />
            </motion.button>
            <NavItem icon={<MessageCircle size={20} />} label="Chat" onClick={() => {}} disabled />
            <NavItem icon={<Menu size={20} />} label="More" onClick={() => {}} disabled />
          </div>
        </div>
      </nav>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function NavItem({ icon, label, onClick, disabled = false }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 text-[#9C8490] hover:text-[#E98DA3] transition-colors duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
      aria-label={label}
    >
      {icon}
      <span className="text-[10px] font-sans tracking-wide">{label}</span>
    </button>
  );
}
