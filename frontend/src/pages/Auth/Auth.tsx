import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { useAuthStore } from '@/stores/authStore';
import { routeForStatus } from '@/routes/journeyRoutes';

type AuthMode = 'sign-in' | 'sign-up';

/**
 * Auth page — sign in / sign up.
 * Beautiful glass card with flexbox gap spacing, tab bar inside card,
 * and zero layout shifts or overlapping text/inputs.
 */
export function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading, onboardingStatus } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /*
   * One redirect for everyone, and the destination comes from the profile row
   * that has just been read — a brand-new account lands on the journey, someone
   * returning lands on the dashboard. Nothing here needs to know which of the
   * two just happened, which is why sign-in and sign-up share this path.
   */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(routeForStatus(onboardingStatus), { replace: true });
    }
  }, [isAuthenticated, isLoading, onboardingStatus, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === 'sign-in') {
        // No navigation here: the effect above sends them on once the session
        // and the profile's journey status have both been hydrated.
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
        // With email confirmation on, signing up gives no session yet — so the
        // journey starts at the first sign-in instead, from the same DB state.
        setSuccess(
          'Account created! Check your email to confirm, then sign in.'
        );
        setMode('sign-in');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    if (mode === newMode) return;
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-our-world px-4 py-12">

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-[#B83B5E]/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-[#5A2435]/25 blur-3xl" />
      </div>

      {/* Flower accents */}
      <FlowerAccent
        variant="rose"
        size={50}
        color="#B83B5E"
        opacity={0.12}
        delay={0}
        className="absolute top-6 right-8 hidden sm:block"
      />
      <FlowerAccent
        variant="petal"
        size={22}
        color="#E98DA3"
        opacity={0.18}
        delay={1}
        className="absolute bottom-16 left-6 hidden sm:block"
      />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-[#9C8490] hover:text-[#E98DA3] transition-colors flex items-center gap-1.5 text-sm font-sans cursor-pointer py-2 px-3 rounded-lg hover:bg-white/5"
        aria-label="Back to home"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </motion.button>

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md my-auto"
      >
        <div className="glass-card p-6 sm:p-8 flex flex-col shadow-2xl">

          {/* Mode Tab Switcher inside card */}
          <div className="relative w-full flex items-center bg-black/40 p-1.5 rounded-xl mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => switchMode('sign-in')}
              className={`relative flex-1 py-2.5 text-xs sm:text-sm font-semibold font-sans rounded-lg transition-colors cursor-pointer select-none text-center ${
                mode === 'sign-in' ? 'text-[#FFFCF9]' : 'text-[#9C8490] hover:text-[#E98DA3]'
              }`}
            >
              {mode === 'sign-in' && (
                <motion.div
                  layoutId="auth-tab-bg"
                  className="absolute inset-0 bg-[#B83B5E] rounded-lg shadow-md shadow-[#B83B5E]/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('sign-up')}
              className={`relative flex-1 py-2.5 text-xs sm:text-sm font-semibold font-sans rounded-lg transition-colors cursor-pointer select-none text-center ${
                mode === 'sign-up' ? 'text-[#FFFCF9]' : 'text-[#9C8490] hover:text-[#E98DA3]'
              }`}
            >
              {mode === 'sign-up' && (
                <motion.div
                  layoutId="auth-tab-bg"
                  className="absolute inset-0 bg-[#B83B5E] rounded-lg shadow-md shadow-[#B83B5E]/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">Sign Up</span>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1
              className="text-3xl font-light text-[#FFFCF9] mb-1.5 tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {mode === 'sign-in' ? 'Welcome Back' : 'Begin Your Story'}
            </h1>
            <p className="text-xs sm:text-sm text-[#9C8490] font-sans font-light">
              {mode === 'sign-in'
                ? 'Your private universe is waiting.'
                : 'Create a private universe for two.'}
            </p>
          </div>

          {/* Form with Flexbox Gap (prevents overlap) */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Display name — sign up only */}
            {mode === 'sign-up' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Input
                  id="display-name"
                  label="Your Name"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </motion.div>
            )}

            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete={mode === 'sign-in' ? 'current-email' : 'new-email'}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-[#9C8490] hover:text-[#E98DA3] transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5 flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Error / success banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-300 font-sans text-center"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-xl bg-[#E98DA3]/10 border border-[#E98DA3]/20 text-xs sm:text-sm text-[#E98DA3] font-sans text-center"
                  role="status"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              id={mode === 'sign-in' ? 'sign-in-btn' : 'sign-up-btn'}
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              className="w-full mt-2 tracking-widest uppercase text-sm font-semibold shadow-lg shadow-[#B83B5E]/30 min-h-[48px]"
            >
              {mode === 'sign-in' ? 'Enter Our World' : 'Create Account'}
            </Button>
          </form>

          {/* Mode Toggle Footer */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              className="text-xs sm:text-sm text-[#9C8490] hover:text-[#E98DA3] transition-colors font-sans cursor-pointer"
            >
              {mode === 'sign-in'
                ? "Need an account? Switch to Sign Up"
                : 'Already registered? Switch to Sign In'}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
