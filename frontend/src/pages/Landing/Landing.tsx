import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FloatingPetals, FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.22, delayChildren: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-our-world">

      {/* Floating petals */}
      <FloatingPetals color="#E98DA3" />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#B83B5E]/8 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-[#5A2435]/30 blur-3xl" />
      </div>

      {/* Decorative flowers */}
      <FlowerAccent
        variant="rose" size={60} color="#B83B5E" opacity={0.18} delay={0.5}
        className="absolute top-8 right-12 hidden sm:block"
      />
      <FlowerAccent
        variant="bud" size={35} color="#C9A45C" opacity={0.15} delay={1.5}
        className="absolute bottom-24 left-10 hidden sm:block"
      />
      <FlowerAccent
        variant="petal" size={25} color="#E98DA3" opacity={0.2} delay={2}
        className="absolute top-1/3 left-6"
      />

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg mx-auto"
      >
        {/* Caption */}
        <motion.p variants={itemVariants} className="caption-gold mb-6">
          A private universe
        </motion.p>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="heading-display mb-2 relative"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          OUR
          <br />
          <span className="text-[#E98DA3]">WORLD</span>

          {/* Underline accent */}
          <motion.div
            className="absolute -bottom-2 left-1/2 h-px bg-gradient-to-r from-transparent via-[#B83B5E] to-transparent"
            initial={{ width: 0, x: '-50%' }}
            animate={{ width: '80%', x: '-50%' }}
            transition={{ duration: 1.2, delay: 1, ease: 'easeOut' }}
          />
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mt-8 text-lg sm:text-xl font-serif font-light italic text-[#E98DA3]/80 leading-relaxed"
        >
          A little universe
          <br />
          made for two.
        </motion.p>

        {/* Enter button */}
        <motion.div variants={itemVariants} className="mt-12">
          <Button
            id="enter-world-btn"
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
            className="min-w-[200px] animate-pulse-glow font-serif tracking-widest uppercase text-base"
          >
            Enter ❤️
          </Button>
        </motion.div>

        {/* Quote */}
        <motion.p
          variants={itemVariants}
          className="mt-16 text-sm font-sans font-light italic text-[#C9A45C]/60 tracking-wide"
        >
          "Some stories are worth keeping."
        </motion.p>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-[#E98DA3]/40 to-transparent mx-auto"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
