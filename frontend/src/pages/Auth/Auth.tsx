import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { useAuthStore } from '@/stores/authStore';

type AuthMode = 'sign-in' | 'sign-up';

/**
 * Auth page — sign in / sign up toggle.
 * Soft card on the cinematic background from Landing.
 * No hardcoded credentials, no secrets, no debug logs.
 */
export function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
        navigate('/home', { replace: true });
      } else {
        await signUp(email, password, displayName);
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

  const toggleMode = () => {
    setMode(m => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-our-world px-4">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-[#B83B5E]/6 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-[#5A2435]/20 blur-3xl" />
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
        transition={{ delay: 0.3 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-[#9C8490] hover:text-[#E98DA3] transition-colors flex items-center gap-1 text-sm font-sans cursor-pointer"
        aria-label="Back to home"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </motion.button>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass-card p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-light text-[#FFFCF9] mb-2 tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {mode === 'sign-in' ? 'Welcome back' : 'Begin your story'}
            </h1>
            <p className="text-sm text-[#9C8490] font-sans font-light">
              {mode === 'sign-in'
                ? 'Your world is waiting.'
                : 'Create your private universe.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Display name — sign up only */}
            <AnimatePresence>
              {mode === 'sign-up' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Input
                    id="display-name"
                    label="Your name"
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    autoComplete="name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete={mode === 'sign-in' ? 'current-email' : 'new-email'}
            />

            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-4 text-[#9C8490] hover:text-[#E98DA3] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error / success */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-red-400 font-sans text-center"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-[#E98DA3] font-sans text-center"
                  role="status"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              id={mode === 'sign-in' ? 'sign-in-btn' : 'sign-up-btn'}
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              className="w-full mt-2 tracking-widest uppercase text-sm"
            >
              {mode === 'sign-in' ? 'Enter Our World' : 'Create Account'}
            </Button>
          </form>

          {/* Mode toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-[#9C8490] hover:text-[#E98DA3] transition-colors font-sans cursor-pointer"
            >
              {mode === 'sign-in'
                ? "Don't have an account? Begin here."
                : 'Already have an account? Sign in.'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
