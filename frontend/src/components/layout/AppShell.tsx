import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, ImageIcon, Heart, MessageCircle, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

export function AppShell() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-dvh bg-our-world">
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
    <div className="flex-1 flex flex-col bg-our-world min-h-dvh relative">
      {/* Page content */}
      <main className="flex-1 pb-24 overflow-y-auto w-full">
        <Outlet />
      </main>

      {/* Floating Bottom Glass Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:pb-6 flex justify-center pointer-events-none">
        <div className="glass-card pointer-events-auto rounded-2xl border border-white/10 px-6 py-3 shadow-2xl bg-[#241B20]/90 backdrop-blur-xl w-full max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <NavItem
              icon={<Home size={20} />}
              label="Home"
              onClick={() => navigate('/home')}
              active={location.pathname === '/home'}
            />
            <NavItem
              icon={<ImageIcon size={20} />}
              label="Memories"
              onClick={() => navigate('/memories')}
              active={location.pathname === '/memories'}
            />
            
            {/* Center heart action */}
            <motion.button
              whileHover={{ scale: 1.1, translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/memories')}
              className="w-12 h-12 rounded-full bg-[#B83B5E] flex items-center justify-center shadow-lg shadow-[#B83B5E]/50 cursor-pointer shrink-0 border border-[#E98DA3]/30 -mt-5"
              aria-label="Add / Memories"
            >
              <Heart size={20} className="fill-white color-white" />
            </motion.button>

            <NavItem
              icon={<MessageCircle size={20} />}
              label="Chat"
              onClick={() => navigate('/messages')}
              active={location.pathname === '/messages'}
            />
            <NavItem
              icon={<Menu size={20} />}
              label="More"
              onClick={() => navigate('/more')}
              active={['/more', '/events', '/playlist', '/gifts', '/quizzes', '/understanding'].includes(location.pathname)}
            />
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
  active?: boolean;
}

function NavItem({ icon, label, onClick, disabled = false, active = false }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed ${
        active
          ? 'text-[#E98DA3]'
          : 'text-[#9C8490] hover:text-[#E98DA3] disabled:opacity-40'
      }`}
      aria-label={label}
    >
      {icon}
      <span className="text-[10px] font-sans font-medium tracking-wide">{label}</span>
    </button>
  );
}
