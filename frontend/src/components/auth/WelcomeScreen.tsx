import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';
import { FloatingPetals, FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { routeForStatus } from '@/routes/journeyRoutes';
import { useNavigate } from 'react-router-dom';

interface WelcomeScreenProps {
  onEnter?: () => void;
}

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const { user, onboardingStatus, setHasJustAuthenticated } = useAuthStore();
  const [countdown, setCountdown] = useState(3);

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'My Love';
  const targetRoute = routeForStatus(onboardingStatus);
  const isNewUser = onboardingStatus === 'not_started';

  const handleProceed = () => {
    setHasJustAuthenticated(false);
    if (onEnter) {
      onEnter();
    } else {
      navigate(targetRoute, { replace: true });
    }
  };

  // Auto transition after countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetRoute]);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-our-world p-4 select-none">
      {/* Floating petals animation */}
      <FloatingPetals color="#E98DA3" />

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#B83B5E]/15 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#C9A45C]/12 blur-3xl" />
      </div>

      {/* Flower accents */}
      <FlowerAccent
        variant="rose"
        size={56}
        color="#B83B5E"
        opacity={0.25}
        delay={0.2}
        className="absolute top-10 right-12 hidden sm:block"
      />
      <FlowerAccent
        variant="bud"
        size={36}
        color="#C9A45C"
        opacity={0.2}
        delay={0.6}
        className="absolute bottom-16 left-12 hidden sm:block"
      />

      {/* Central Welcome Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md my-auto text-center"
      >
        <div className="glass-card p-8 sm:p-10 rounded-3xl border border-[#E98DA3]/30 bg-[#241B20]/90 backdrop-blur-2xl shadow-2xl flex flex-col items-center">
          
          {/* Glowing Heart Emblem */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], rotate: [0, 2, 0, -2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#B83B5E] to-[#C9A45C] flex items-center justify-center mb-6 shadow-lg shadow-[#B83B5E]/40 border border-white/20"
          >
            <Heart size={30} className="fill-white text-white" />
          </motion.div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-xs font-sans tracking-widest uppercase mb-4">
            <Sparkles size={13} />
            <span>✨ CONGRATULATIONS! ✨</span>
          </div>

          {/* Main heading */}
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9] mb-2 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Successfully Logged In
          </h1>

          <p
            className="text-lg sm:text-xl font-serif text-[#E98DA3] mb-4 italic"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Welcome to Our World, {displayName} ❤️
          </p>

          <p className="text-xs sm:text-sm text-[#9C8490] font-sans font-light max-w-xs mb-8 leading-relaxed">
            {isNewUser
              ? 'Your private universe is ready to be born. Let us begin our shared journey.'
              : 'Your memories, messages, and quiet sanctuary are waiting for you.'}
          </p>

          {/* Action button */}
          <Button
            id="enter-our-world-welcome-btn"
            variant="primary"
            size="lg"
            onClick={handleProceed}
            className="w-full flex items-center justify-center gap-2 py-4 tracking-widest uppercase text-sm font-semibold shadow-xl shadow-[#B83B5E]/30 min-h-[50px] cursor-pointer"
          >
            <span>{isNewUser ? 'Begin Journey' : 'Enter Our World ❤️'}</span>
            <ArrowRight size={16} />
          </Button>

          {/* Subtext with auto-transition indicator */}
          <p className="text-[11px] text-[#9C8490]/60 font-sans mt-4">
            Opening your world in {countdown}s...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
