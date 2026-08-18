/**
 * BirthdaySurprise — the emotional centre of the journey.
 *
 * Reached only once, immediately after the gateway, and only while
 * `profiles.onboarding_status = 'questions_completed'`. Once it is finished the
 * status moves on and the route stops being reachable, so nobody ever gets the
 * surprise twice. (The separate cinematic `/birthday` feature is untouched and
 * still lives in the More menu.)
 *
 * Three beats: arrive → make a wish → read the letter.
 *
 * The candles go out by tapping — always. The microphone is an extra that has to
 * be asked for explicitly, and sound has a visible mute control, so nothing is
 * ever forced on the person this was built for.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mic, Volume2, VolumeX, Heart } from 'lucide-react';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { JourneyBackdrop } from '@/components/journey/JourneyBackdrop';
import { CandleCake } from '@/components/journey/CandleCake';
import { Celebration, HeartBurst } from '@/components/journey/JourneyParticles';
import { Button } from '@/components/ui/Button';
import { useBlowDetection } from '@/hooks/useBlowDetection';
import { useAuthStore } from '@/stores/authStore';
import { fetchOnboardingAnswer } from '@/services/onboardingService';
import { JOURNEY_PATHS } from '@/routes/journeyRoutes';
import { buildBirthdayMessage } from '@/content/journey';
import { playPuff, playCelebration } from '@/utils/sound';

type Phase = 'arrive' | 'wish' | 'letter';

export function BirthdaySurprise() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { couple, advanceJourney } = useAuthStore();

  const [phase, setPhase] = useState<Phase>('arrive');
  const [promise, setPromise] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const content = useMemo(
    () =>
      buildBirthdayMessage({
        partnerName: couple?.partner_name,
        coupleName: couple?.couple_name,
        promise,
      }),
    [couple?.partner_name, couple?.couple_name, promise],
  );

  const [litFlags, setLitFlags] = useState<boolean[]>(() =>
    Array.from({ length: content.candleCount }, () => true),
  );
  const [celebrating, setCelebrating] = useState(0);
  const allOut = litFlags.every((lit) => !lit);

  // Their own words from Chapter One close the letter, if they wrote any.
  useEffect(() => {
    if (!couple?.id) return;
    let active = true;
    void fetchOnboardingAnswer(couple.id, 'first_memory').then((answer) => {
      if (active && answer) setPromise(answer);
    });
    return () => {
      active = false;
    };
  }, [couple?.id]);

  // Beat one is a held breath, not a screen to click through.
  useEffect(() => {
    if (phase !== 'arrive') return;
    const timer = window.setTimeout(() => setPhase('wish'), reduceMotion ? 1200 : 3400);
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  const extinguish = (index: number) => {
    setLitFlags((flags) => {
      if (!flags[index]) return flags;
      const next = [...flags];
      next[index] = false;
      return next;
    });
    playPuff(soundOn);
  };

  const extinguishAll = () => {
    setLitFlags((flags) => (flags.every((lit) => !lit) ? flags : flags.map(() => false)));
    playPuff(soundOn);
  };

  const { status: micStatus, level, start: startListening } = useBlowDetection(extinguishAll);

  // Every candle out → celebrate, then reveal the letter. The mute state is read
  // through a ref so muting afterwards never replays the cue.
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  useEffect(() => {
    if (phase !== 'wish' || !allOut) return;

    setCelebrating((n) => n + 1);
    playCelebration(soundRef.current);

    const timer = window.setTimeout(() => setPhase('letter'), reduceMotion ? 1100 : 2900);
    return () => window.clearTimeout(timer);
  }, [phase, allOut, reduceMotion]);

  const continueToMemories = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    await advanceJourney('birthday_completed');
    navigate(JOURNEY_PATHS.memories, { replace: true });
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-8 sm:px-8 sm:py-10">
      <JourneyBackdrop mood="warm" />
      <Celebration trigger={celebrating} />

      {/* Sound control — visible, and off is one tap away */}
      <div className="relative z-20 flex justify-end">
        <button
          type="button"
          onClick={() => setSoundOn((on) => !on)}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E98DA3]/20 bg-white/[0.04] text-[#E98DA3]/70 transition-colors hover:border-[#E98DA3]/50 hover:text-[#E98DA3]"
        >
          {soundOn ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
        </button>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ── Beat one: arrive ── */}
          {phase === 'arrive' && (
            <motion.div
              key="arrive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.1 }}
              className="py-16 text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.4, delay: 0.3 }}
                className="mb-8 flex justify-center gap-3"
              >
                <FlowerAccent variant="rose" size={40} color="#E98DA3" opacity={0.4} />
                <FlowerAccent variant="bud" size={54} color="#C9A45C" opacity={0.5} />
                <FlowerAccent variant="rose" size={40} color="#E98DA3" opacity={0.4} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.7 }}
                className="caption-gold mb-5"
              >
                {content.eyebrow}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, delay: 1.2 }}
                className="text-[2.1rem] font-light leading-tight text-[#FFFCF9] sm:text-[3rem]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {content.greeting}
              </motion.h1>
            </motion.div>
          )}

          {/* ── Beat two: make a wish ── */}
          {phase === 'wish' && (
            <motion.div
              key="wish"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full text-center"
            >
              <h1
                className="mb-1 text-[1.7rem] font-light leading-tight text-[#FFFCF9] sm:text-[2.3rem]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {content.greeting}
              </h1>
              <p className="caption-gold mb-7">{content.candlePrompt}</p>

              <CandleCake litFlags={litFlags} onTapCandle={extinguish} interactive={!allOut} />

              <div className="mt-8 min-h-[92px]">
                <AnimatePresence mode="wait">
                  {allOut ? (
                    <motion.p
                      key="celebrating"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="status"
                      className="mx-auto max-w-sm text-lg leading-relaxed text-[#E8C97A] sm:text-xl"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {content.celebration}
                    </motion.p>
                  ) : (
                    <motion.div
                      key="prompting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <p className="font-sans text-sm text-[#9C8490]">{content.candleHint}</p>

                      {/* Optional extra. Nothing is requested until this is pressed. */}
                      {micStatus === 'idle' && (
                        <button
                          type="button"
                          onClick={() => void startListening()}
                          className="flex cursor-pointer items-center gap-2 rounded-full border border-[#E98DA3]/20 px-4 py-2 font-sans text-xs tracking-wide text-[#9C8490] transition-colors hover:border-[#E98DA3]/45 hover:text-[#E98DA3]"
                        >
                          <Mic size={13} aria-hidden="true" />
                          or blow into the microphone
                        </button>
                      )}

                      {micStatus === 'requesting' && (
                        <p className="font-sans text-xs text-[#9C8490]">Waiting for permission…</p>
                      )}

                      {micStatus === 'listening' && (
                        <div className="flex flex-col items-center gap-2">
                          <p className="font-sans text-xs tracking-wide text-[#E98DA3]">
                            Listening… take a breath and blow
                          </p>
                          <div
                            className="h-1 w-32 overflow-hidden rounded-full bg-white/10"
                            role="progressbar"
                            aria-label="Microphone level"
                            aria-valuenow={Math.round(level * 100)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[#E98DA3] to-[#C9A45C]"
                              style={{ width: `${Math.min(100, level * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {(micStatus === 'denied' || micStatus === 'unsupported') && (
                        <p className="font-sans text-xs text-[#9C8490]/80">
                          No microphone — tapping the candles works just as well.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── Beat three: the letter ── */}
          {phase === 'letter' && (
            <motion.div
              key="letter"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full py-4"
            >
              <div className="glass-card relative overflow-hidden border border-[#C9A45C]/20 p-6 text-center sm:p-10">
                <HeartBurst trigger={celebrating} count={10} />

                <FlowerAccent
                  variant="rose"
                  size={52}
                  color="#C9A45C"
                  opacity={0.16}
                  className="absolute -right-2 -top-2"
                />

                <h1
                  className="mb-6 text-[1.9rem] font-light leading-tight text-[#FFFCF9] sm:text-[2.5rem]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {content.greeting}
                </h1>

                <div className="mx-auto mb-7 max-w-md space-y-4 text-left">
                  {content.paragraphs.map((paragraph, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.25 }}
                      className="font-sans text-[13.5px] leading-relaxed text-[#E4D5DB]/90 sm:text-sm"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>

                {/* The line the whole page exists for */}
                <motion.blockquote
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 + content.paragraphs.length * 0.25 }}
                  className="mx-auto mb-8 max-w-sm border-t border-b border-[#C9A45C]/20 py-5"
                >
                  <p
                    className="whitespace-pre-line text-xl leading-snug text-[#E8C97A] sm:text-2xl"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {content.quote}
                  </p>
                </motion.blockquote>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={continueToMemories}
                  isLoading={isLeaving}
                  className="w-full min-h-[52px] sm:w-auto"
                  autoFocus
                >
                  <Heart size={16} aria-hidden="true" />
                  {content.cta}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
