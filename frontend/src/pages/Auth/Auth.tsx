import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Phone, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FlowerAccent, FloatingPetals } from '@/components/flowers/FlowerAccent';
import { WelcomeScreen } from '@/components/auth/WelcomeScreen';
import { useAuthStore } from '@/stores/authStore';
import { routeForStatus } from '@/routes/journeyRoutes';

type AuthMode = 'sign-in' | 'sign-up' | 'phone' | 'forgot-password';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
];

export function Auth() {
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    signInWithOtp,
    verifyOtp,
    signInWithOAuth,
    resetPassword,
    isAuthenticated,
    isLoading,
    hasJustAuthenticated,
    onboardingStatus,
  } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('sign-in');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phone OTP state
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Check URL query parameters or hash for OAuth redirect error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash);
    const errDesc = urlParams.get('error_description') || hashParams.get('error_description') || urlParams.get('msg') || hashParams.get('msg') || urlParams.get('error') || hashParams.get('error');

    if (errDesc) {
      const lower = errDesc.toLowerCase();
      if (lower.includes('unsupported provider') || lower.includes('not enabled')) {
        setError('Google Sign-In is not enabled yet in your Supabase Dashboard. Enable Google under Authentication → Providers → Google.');
      } else {
        setError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
      }
    }
  }, []);

  // Focus OTP input when sent
  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent]);

  // If already authenticated and NOT in the middle of welcoming, redirect to the right route
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasJustAuthenticated) {
      navigate(routeForStatus(onboardingStatus), { replace: true });
    }
  }, [isAuthenticated, isLoading, hasJustAuthenticated, onboardingStatus, navigate]);

  // Show Welcome Screen if user has just authenticated!
  if (isAuthenticated && hasJustAuthenticated) {
    return <WelcomeScreen onEnter={() => navigate(routeForStatus(onboardingStatus), { replace: true })} />;
  }

  // ─── Email / Password Submit ───────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    if (mode === 'sign-up') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter carefully.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName.trim() || undefined);
        setSuccess('Account created! Welcome to Our World ❤️');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Phone OTP: Send Code ──────────────────────────────────────────────────
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 4) {
      setError('Please enter a valid phone number.');
      return;
    }

    const fullPhone = `${countryCode}${cleanNumber}`;
    setSubmitting(true);
    try {
      await signInWithOtp(fullPhone);
      setOtpSent(true);
      setResendTimer(30);
      setSuccess(`Verification code sent to ${countryCode} ${cleanNumber}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Phone OTP: Verify Code ────────────────────────────────────────────────
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanToken = otpCode.replace(/\D/g, '');
    if (cleanToken.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const fullPhone = `${countryCode}${cleanNumber}`;

    setSubmitting(true);
    try {
      await verifyOtp(fullPhone, cleanToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification code invalid or expired. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Forgot Password Submit ────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Please enter your email address to receive a password reset link.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Password reset link has been sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send password reset email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Social Login (Google, Facebook) ───────────────────────────────────────
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    setSuccess(null);
    setSocialLoading(provider);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not connect with ${provider}. Please try again.`);
      setSocialLoading(null);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setOtpSent(false);
    setOtpCode('');
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-y-auto bg-our-world px-4 py-8 sm:py-12">
      {/* Floating Petals */}
      <FloatingPetals color="#E98DA3" />

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#5A2435]/25 blur-3xl" />
      </div>

      {/* Subtle Flower Accents */}
      <FlowerAccent
        variant="rose"
        size={46}
        color="#B83B5E"
        opacity={0.15}
        delay={0}
        className="absolute top-6 right-8 hidden sm:block"
      />
      <FlowerAccent
        variant="petal"
        size={24}
        color="#E98DA3"
        opacity={0.2}
        delay={1}
        className="absolute bottom-10 left-8 hidden sm:block"
      />

      {/* Main Centered Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md my-auto"
      >
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-[#E98DA3]/25 bg-[#241B20]/90 backdrop-blur-xl shadow-2xl flex flex-col">
          
          {/* Brand Header */}
          <div className="text-center mb-6">
            <p className="caption-gold text-xs flex items-center justify-center gap-1.5 mb-1">
              <Sparkles size={13} className="text-[#C9A45C]" />
              <span>OUR WORLD</span>
            </p>
            <h1
              className="text-3xl sm:text-4xl font-light text-[#FFFCF9] tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {mode === 'sign-in' && 'Welcome Back ❤️'}
              {mode === 'sign-up' && 'Create Your World ❤️'}
              {mode === 'phone' && 'Phone Verification 📱'}
              {mode === 'forgot-password' && 'Reset Password 🔑'}
            </h1>
            <p className="text-xs sm:text-sm text-[#9C8490] font-sans font-light mt-1">
              {mode === 'sign-in' && 'Sign in to your private universe made for two.'}
              {mode === 'sign-up' && 'Begin your shared digital journal together.'}
              {mode === 'phone' && 'Instant passcode sign-in via SMS.'}
              {mode === 'forgot-password' && 'Enter your email to receive a recovery link.'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Sign In / Sign Up) */}
          {(mode === 'sign-in' || mode === 'sign-up') && (
            <div className="relative w-full flex items-center bg-black/40 p-1.5 rounded-2xl mb-6 border border-white/10">
              <button
                type="button"
                onClick={() => switchMode('sign-in')}
                className={`relative flex-1 py-2.5 text-xs sm:text-sm font-semibold font-sans rounded-xl transition-colors cursor-pointer select-none text-center ${
                  mode === 'sign-in' ? 'text-[#FFFCF9]' : 'text-[#9C8490] hover:text-[#E98DA3]'
                }`}
              >
                {mode === 'sign-in' && (
                  <motion.div
                    layoutId="auth-tab-bg"
                    className="absolute inset-0 bg-[#B83B5E] rounded-xl shadow-md shadow-[#B83B5E]/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('sign-up')}
                className={`relative flex-1 py-2.5 text-xs sm:text-sm font-semibold font-sans rounded-xl transition-colors cursor-pointer select-none text-center ${
                  mode === 'sign-up' ? 'text-[#FFFCF9]' : 'text-[#9C8490] hover:text-[#E98DA3]'
                }`}
              >
                {mode === 'sign-up' && (
                  <motion.div
                    layoutId="auth-tab-bg"
                    className="absolute inset-0 bg-[#B83B5E] rounded-xl shadow-md shadow-[#B83B5E]/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">Sign Up</span>
              </button>
            </div>
          )}

          {/* Feedback Banners */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs sm:text-sm text-red-300 font-sans text-center leading-relaxed"
                role="alert"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3.5 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-xs sm:text-sm text-[#C9A45C] font-sans text-center flex items-center justify-center gap-2"
                role="status"
              >
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── 1. Email & Password Form ──────────────────────────────────── */}
          {(mode === 'sign-in' || mode === 'sign-up') && (
            <form onSubmit={handleEmailSubmit} noValidate className="flex flex-col gap-4">
              {mode === 'sign-up' && (
                <Input
                  id="display-name"
                  label="Your Name or Nickname"
                  placeholder="e.g. Juliet"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              )}

              <Input
                id="email"
                label="Email Address"
                placeholder="ourworld@couple.love"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete={mode === 'sign-in' ? 'current-email' : 'new-email'}
              />

              <Input
                id="password"
                label="Password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-[#9C8490] hover:text-[#E98DA3] transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5 flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {mode === 'sign-up' && (
                <Input
                  id="confirm-password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="text-[#9C8490] hover:text-[#E98DA3] transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5 flex items-center justify-center"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              )}

              {mode === 'sign-in' && (
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-xs text-[#9C8490] hover:text-[#E98DA3] transition-colors font-sans cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <Button
                id={mode === 'sign-in' ? 'sign-in-btn' : 'sign-up-btn'}
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                className="w-full mt-2 tracking-widest uppercase text-sm font-semibold shadow-lg shadow-[#B83B5E]/30 min-h-[48px]"
              >
                {mode === 'sign-in' ? 'Continue' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* ─── 2. Phone OTP Form ─────────────────────────────────────────── */}
          {mode === 'phone' && (
            <div className="flex flex-col gap-4">
              {!otpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-[#1A1015] border border-[#E98DA3]/20 rounded-xl px-2.5 py-3 text-sm text-[#FFFCF9] focus:outline-none focus:border-[#E98DA3] cursor-pointer"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code + c.country} value={c.code} className="bg-[#241B20] text-white">
                            {c.flag} {c.code} ({c.country})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="flex-1 bg-[#1A1015] border border-[#E98DA3]/20 rounded-xl px-3.5 py-3 text-sm text-[#FFFCF9] focus:outline-none focus:border-[#E98DA3] placeholder-[#9C8490]/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={submitting}
                    className="w-full mt-2 tracking-widest uppercase text-sm font-semibold shadow-lg shadow-[#B83B5E]/30 min-h-[48px]"
                  >
                    Send OTP Code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                        Enter 6-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-[#E98DA3] hover:underline font-sans"
                      >
                        Change number
                      </button>
                    </div>
                    <input
                      ref={otpInputRef}
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full bg-[#1A1015] border border-[#E98DA3]/30 rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.4em] font-mono text-[#FFFCF9] focus:outline-none focus:border-[#E98DA3]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#9C8490] font-sans">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      disabled={resendTimer > 0 || submitting}
                      onClick={handleSendPhoneOtp}
                      className="text-[#E98DA3] hover:underline disabled:opacity-40 cursor-pointer"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={submitting}
                    className="w-full mt-2 tracking-widest uppercase text-sm font-semibold shadow-lg shadow-[#B83B5E]/30 min-h-[48px]"
                  >
                    Verify & Enter ❤️
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ─── 3. Forgot Password Form ───────────────────────────────────── */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <Input
                id="reset-email"
                label="Your Account Email"
                placeholder="ourworld@couple.love"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                className="w-full mt-2 tracking-widest uppercase text-sm font-semibold shadow-lg shadow-[#B83B5E]/30 min-h-[48px]"
              >
                Send Reset Link
              </Button>

              <button
                type="button"
                onClick={() => switchMode('sign-in')}
                className="text-xs text-[#9C8490] hover:text-[#E98DA3] transition-colors font-sans mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* ─── Divider: OR ───────────────────────────────────────────────── */}
          {mode !== 'forgot-password' && (
            <>
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#241B20] px-4 text-xs font-sans uppercase tracking-widest text-[#9C8490]">
                  OR
                </span>
              </div>

              {/* ─── Supported Social & Alternate Providers ────────────────── */}
              <div className="flex flex-col gap-2.5">
                {/* Google OAuth */}
                <button
                  type="button"
                  disabled={socialLoading !== null || submitting}
                  onClick={() => handleSocialLogin('google')}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-[#FFFCF9] text-xs sm:text-sm font-sans transition-all cursor-pointer disabled:opacity-40 min-h-[46px]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{socialLoading === 'google' ? 'Connecting with Google...' : 'Continue with Google'}</span>
                </button>

                {/* Facebook OAuth */}
                <button
                  type="button"
                  disabled={socialLoading !== null || submitting}
                  onClick={() => handleSocialLogin('facebook')}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-[#FFFCF9] text-xs sm:text-sm font-sans transition-all cursor-pointer disabled:opacity-40 min-h-[46px]"
                >
                  <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>{socialLoading === 'facebook' ? 'Connecting with Facebook...' : 'Continue with Facebook'}</span>
                </button>

                {/* Phone Toggle */}
                {mode !== 'phone' ? (
                  <button
                    type="button"
                    onClick={() => switchMode('phone')}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-[#C9A45C] text-xs sm:text-sm font-sans transition-all cursor-pointer min-h-[46px]"
                  >
                    <Phone size={15} />
                    <span>Continue with Phone Number</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode('sign-in')}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-[#E98DA3] text-xs sm:text-sm font-sans transition-all cursor-pointer min-h-[46px]"
                  >
                    <Mail size={15} />
                    <span>Continue with Email & Password</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-[11px] text-[#9C8490]/70 font-sans">
              🔒 100% Private & Encrypted with Supabase Auth
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
