/**
 * Onboarding — the guided first entry into Our World.
 *
 * Two modes, decided by server state, never by a local flag:
 *
 *  • JOURNEY MODE (profiles.onboarding_status === 'not_started')
 *    Welcome → Chapter One (the details the app needs) → Chapter Two (the
 *    teasing game, where a wrong answer only ever earns a nudge) → the gateway,
 *    which dims the room, opens the door, and hands over to the birthday
 *    surprise. Progress is written to the database after every step, so a
 *    refresh resumes on the same question.
 *
 *  • EDIT MODE (journey already complete)
 *    Chapter One on its own, as the plain details form Home links to. A
 *    returning user never sees the game, the gateway or the surprise again.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation, useReducedMotion } from 'framer-motion';
import { Check, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { JourneyBackdrop } from '@/components/journey/JourneyBackdrop';
import { HeartBurst } from '@/components/journey/JourneyParticles';
import { SlideToContinue } from '@/components/journey/SlideToContinue';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { saveOnboardingData, saveJourneyAnswer } from '@/services/onboardingService';
import { createCouple } from '@/services/api';
import { JOURNEY_PATHS } from '@/routes/journeyRoutes';
import { playUnlock } from '@/utils/sound';
import {
  JOURNEY_QUESTIONS,
  SETUP_ONLY_QUESTIONS,
  CHAPTER_LABELS,
  JOURNEY_COPY,
  validateJourneyAnswer,
  type AnswerVerdict,
  type JourneyQuestion,
} from '@/content/journey';
import type { Couple } from '@/types';

type Stage = 'welcome' | 'questions' | 'gateway';

export function Onboarding() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user, couple, loadCouple, onboardingStatus, onboardingStep, setJourneyStep, advanceJourney } =
    useAuthStore();

  const isEditMode = onboardingStatus === 'completed';
  const questions = useMemo<JourneyQuestion[]>(
    () => (isEditMode ? SETUP_ONLY_QUESTIONS : JOURNEY_QUESTIONS),
    [isEditMode],
  );

  // ─── Stage / position ───────────────────────────────────────────────────────
  // Resume from the persisted step. Editing always starts at the top.
  const resumeIndex = Math.min(Math.max(0, onboardingStep), questions.length - 1);
  const [stage, setStage] = useState<Stage>(
    isEditMode || resumeIndex > 0 ? 'questions' : 'welcome',
  );
  const [index, setIndex] = useState(isEditMode ? 0 : resumeIndex);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Chapter One answers ────────────────────────────────────────────────────
  const [coupleName, setCoupleName] = useState(couple?.couple_name || '');
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversary_date || '');
  const [partnerName, setPartnerName] = useState(couple?.partner_name || '');
  const [partnerBirthday, setPartnerBirthday] = useState(couple?.partner_birthday || '');
  const [favoriteMemory, setFavoriteMemory] = useState('');

  // Fill the form once the couple record arrives (it loads after first paint).
  useEffect(() => {
    if (!couple) return;
    setCoupleName((v) => v || couple.couple_name || '');
    setAnniversaryDate((v) => v || couple.anniversary_date || '');
    setPartnerName((v) => v || couple.partner_name || '');
    setPartnerBirthday((v) => v || couple.partner_birthday || '');
  }, [couple]);

  useEffect(() => {
    if (isEditMode) {
      setStage('questions');
    }
  }, [isEditMode]);

  // ─── Chapter Two answers ────────────────────────────────────────────────────
  const [choice, setChoice] = useState<number | null>(null);
  const [guess, setGuess] = useState('');
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [burst, setBurst] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  // Animated imperatively so a wrong answer nudges the card without remounting
  // it — remounting would throw away the text the user is still editing.
  const shakeControls = useAnimation();

  const question = questions[index];

  /**
   * What the riddles validate against: whatever is already on the couple record,
   * overlaid with what the user has typed in this session. The overlay matters —
   * it keeps "what name do I keep saved for you?" answerable even if the write to
   * the couple row did not land.
   */
  const validationCouple = useMemo<Couple>(
    () => ({
      id: couple?.id ?? '',
      couple_name: coupleName || couple?.couple_name || null,
      anniversary_date: anniversaryDate || couple?.anniversary_date || null,
      partner_name: partnerName || couple?.partner_name || null,
      partner_birthday: partnerBirthday || couple?.partner_birthday || null,
      partner_1_id: couple?.partner_1_id ?? null,
      partner_2_id: couple?.partner_2_id ?? null,
      created_at: couple?.created_at ?? '',
      updated_at: couple?.updated_at ?? '',
    }),
    [couple, coupleName, anniversaryDate, partnerName, partnerBirthday],
  );

  // ─── Is the current answer good enough to move on? ──────────────────────────
  const setupAnswerReady = (() => {
    if (question.chapter !== 'setup') return false;
    switch (question.kind) {
      case 'text':
        return coupleName.trim().length > 0;
      case 'date':
        return anniversaryDate.trim().length > 0;
      case 'partner_details':
        return partnerName.trim().length > 0;
      case 'textarea':
        return true; // optional — a blank promise is allowed
      default:
        return false;
    }
  })();

  const unlocked = question.chapter === 'setup' ? setupAnswerReady : !!verdict?.correct;

  // The bar leans forward as soon as the step is answerable, so the movement
  // reads as reward rather than as a countdown.
  const progress = ((index + (unlocked ? 1 : 0.35)) / questions.length) * 100;

  // ─── Answering ──────────────────────────────────────────────────────────────
  const judge = (rawValue: string) => {
    const result = validateJourneyAnswer(question, rawValue, attempts, validationCouple);
    setVerdict(result);

    if (result.correct) {
      setBurst((n) => n + 1);
      playUnlock(soundOn);
    } else {
      setAttempts((n) => n + 1);
      if (!reduceMotion) {
        void shakeControls.start({ x: [0, -9, 8, -5, 0], transition: { duration: 0.42 } });
      }
    }
  };

  const selectChoice = (optionIndex: number) => {
    setChoice(optionIndex);
    judge(String(optionIndex));
  };

  const checkGuess = () => {
    if (!guess.trim()) return;
    judge(guess);
  };

  // ─── Moving forward ─────────────────────────────────────────────────────────
  const resetQuestionState = () => {
    setChoice(null);
    setGuess('');
    setVerdict(null);
    setAttempts(0);
  };

  /** Persist this question's answer, then take the next step. */
  const goForward = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const coupleId = await ensureCoupleId();

      // Free-text answers are kept; the couple-record fields are written at the
      // end of Chapter One so the birthday scene can greet by name.
      if (user && coupleId) {
        if (question.id === 'first_memory' && favoriteMemory.trim()) {
          await saveJourneyAnswer(coupleId, user.id, 'first_memory', favoriteMemory);
        } else if (question.chapter === 'riddles') {
          const answer = question.kind === 'choice' ? question.options[choice ?? 0] ?? '' : guess;
          await saveJourneyAnswer(coupleId, user.id, question.id, answer);
        }
      }

      const isLastSetupQuestion =
        question.chapter === 'setup' &&
        (index + 1 >= questions.length || questions[index + 1].chapter !== 'setup');

      if (isLastSetupQuestion) await saveChapterOne(coupleId);

      // Finished the whole thing?
      if (index + 1 >= questions.length) {
        if (isEditMode) {
          navigate(JOURNEY_PATHS.dashboard, { replace: true });
        } else {
          setStage('gateway');
        }
        return;
      }

      const next = index + 1;
      setIndex(next);
      resetQuestionState();
      if (!isEditMode) await setJourneyStep(next);
    } catch (err) {
      console.error('[Onboarding] Could not save this step:', err);
      // Never trap the user on a question because a write failed.
      if (index + 1 >= questions.length) {
        if (isEditMode) navigate(JOURNEY_PATHS.dashboard, { replace: true });
        else setStage('gateway');
      } else {
        setIndex(index + 1);
        resetQuestionState();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    if (index === 0 || isSaving) return;
    const previous = index - 1;
    setIndex(previous);
    resetQuestionState();
    if (!isEditMode) void setJourneyStep(previous);
  };

  /** Make sure a couple row exists before anything is written against it. */
  const ensureCoupleId = async (): Promise<string | null> => {
    if (couple?.id) return couple.id;
    if (!user) return null;
    try {
      const created = await createCouple({
        couple_name: coupleName || undefined,
        anniversary_date: anniversaryDate || undefined,
      });
      await loadCouple();
      return created.couple_id;
    } catch (err) {
      console.warn('[Onboarding] Couple could not be created yet:', err);
      return null;
    }
  };

  const saveChapterOne = async (coupleId: string | null) => {
    if (!user || !coupleId) return;
    await saveOnboardingData({
      coupleId,
      userId: user.id,
      coupleName,
      anniversaryDate,
      partnerName,
      partnerBirthday,
      answers: favoriteMemory.trim() ? { first_memory: favoriteMemory } : {},
    });
    await loadCouple();
  };

  // ─── The gateway: dim, unlock, hand over ────────────────────────────────────
  useEffect(() => {
    if (stage !== 'gateway') return;

    const hold = reduceMotion ? 900 : 4200;
    const timer = window.setTimeout(async () => {
      await advanceJourney('questions_completed');
      navigate(JOURNEY_PATHS.birthday, { replace: true });
    }, hold);

    return () => window.clearTimeout(timer);
  }, [stage, reduceMotion, advanceJourney, navigate]);

  if (stage === 'gateway') return <GatewayScene />;

  // ─── Welcome ────────────────────────────────────────────────────────────────
  if (stage === 'welcome') {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 sm:px-6 py-12 text-center w-full">
        <JourneyBackdrop mood="calm" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center glass-card p-8 sm:p-12 rounded-3xl border border-[#F4B8C9]/25 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95 shadow-2xl"
        >
          <FlowerAccent variant="sakura" size={64} color="#F4B8C9" opacity={0.8} className="mb-4 inline-block" />

          <p className="caption-gold mb-3 text-xs uppercase tracking-widest text-[#E8C97A] font-sans">
            {JOURNEY_COPY.welcome.eyebrow}
          </p>

          <h1
            className="mb-3 text-[2rem] font-light leading-tight text-[#FFFCF9] sm:text-[2.75rem]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {JOURNEY_COPY.welcome.title}
          </h1>

          <p
            className="mb-4 text-lg text-[#F4B8C9] sm:text-xl font-serif italic"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {JOURNEY_COPY.welcome.subtitle}
          </p>

          <p className="mx-auto mb-8 max-w-md font-sans text-xs sm:text-sm leading-relaxed text-[#9C8490]">
            {JOURNEY_COPY.welcome.body}
          </p>

          <Button
            id="onboarding-ready-btn"
            variant="primary"
            size="lg"
            onClick={() => setStage('questions')}
            className="min-h-[52px] w-full max-w-xs tracking-widest uppercase sm:w-auto shadow-lg shadow-[#B83B5E]/40"
            autoFocus
          >
            {JOURNEY_COPY.welcome.cta}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Questions ──────────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-dvh flex-col justify-between items-center w-full overflow-hidden px-4 sm:px-6 md:px-8 py-6 sm:py-10">
      <JourneyBackdrop mood="calm" />

      {/* Header + progress */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span
            className="text-xs text-[#F4B8C9] sm:text-sm font-serif tracking-widest uppercase flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
            {isEditMode ? 'OUR WORLD · YOUR DETAILS' : CHAPTER_LABELS[question.chapter].toUpperCase()}
          </span>

          <div className="flex shrink-0 items-center gap-3">
            <span className="font-sans text-xs text-[#9C8490]">
              {index + 1} / {questions.length}
            </span>
            {!isEditMode && (
              <button
                type="button"
                onClick={() => setSoundOn((on) => !on)}
                aria-pressed={soundOn}
                aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#F4B8C9]/20 text-[#9C8490] transition-colors hover:border-[#F4B8C9]/50 hover:text-[#F4B8C9]"
              >
                {soundOn ? (
                  <Volume2 size={13} aria-hidden="true" />
                ) : (
                  <VolumeX size={13} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-[#B83B5E] via-[#F4B8C9] to-[#E8C97A]"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="relative z-10 w-full max-w-2xl mx-auto my-auto py-6 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full"
          >
            <motion.div
              // A wrong answer nudges the card instead of scolding the user.
              animate={shakeControls}
              className="glass-card relative overflow-hidden border border-[#F4B8C9]/25 bg-gradient-to-b from-[#2E2028]/95 to-[#241B20]/95 p-8 sm:p-10 shadow-2xl rounded-3xl flex flex-col gap-6"
            >
              <HeartBurst trigger={burst} />

              <FlowerAccent
                variant="sakura"
                size={52}
                color="#F4B8C9"
                opacity={0.35}
                className="absolute right-5 top-5"
              />

              <div>
                <h2
                  className="mb-2 pr-14 text-2xl font-light text-[#FFFCF9] sm:text-[2.25rem] leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {question.title}
                </h2>
                <p className="mb-8 font-sans text-sm sm:text-base leading-relaxed text-[#9C8490]">{question.subtitle}</p>
              </div>

              {/* ── Chapter One fields ── */}
              {question.chapter === 'setup' && question.kind === 'text' && (
                <Input
                  id="couple-name-input"
                  label="Couple / Relationship Title"
                  placeholder="e.g. Maya & Alex's Sanctuary"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  autoFocus
                />
              )}

              {question.chapter === 'setup' && question.kind === 'date' && (
                <Input
                  id="anniversary-date-input"
                  type="date"
                  label="Anniversary Date"
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  autoFocus
                />
              )}

              {question.chapter === 'setup' && question.kind === 'partner_details' && (
                <div className="space-y-5">
                  <Input
                    id="partner-name-input"
                    label="Partner's Name or Nickname"
                    placeholder="e.g. My Sunshine"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    autoFocus
                  />
                  <Input
                    id="partner-birthday-input"
                    type="date"
                    label="Partner's Birthday"
                    value={partnerBirthday}
                    onChange={(e) => setPartnerBirthday(e.target.value)}
                  />
                </div>
              )}

              {question.chapter === 'setup' && question.kind === 'textarea' && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="favorite-memory-input"
                    className="font-sans text-xs uppercase tracking-widest text-[#C9A45C]"
                  >
                    Your Special Memory / Promise
                  </label>
                  <textarea
                    id="favorite-memory-input"
                    rows={4}
                    className="w-full rounded-xl border border-[#E98DA3]/20 bg-[#1A1015]/80 p-4 text-sm text-[#FFFCF9] transition-colors placeholder-[#9C8490]/50 focus:border-[#B83B5E] focus:outline-none"
                    placeholder="e.g. When we stayed up all night talking under the stars..."
                    value={favoriteMemory}
                    onChange={(e) => setFavoriteMemory(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {/* ── Chapter Two: pick one ── */}
              {question.chapter === 'riddles' && question.kind === 'choice' && (
                <div className="flex flex-col gap-3" role="radiogroup" aria-label={question.title}>
                  {question.options.map((option, optionIndex) => {
                    const selected = choice === optionIndex;
                    const isRight = selected && verdict?.correct;
                    const isWrong = selected && verdict && !verdict.correct;

                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectChoice(optionIndex)}
                        disabled={!!verdict?.correct && !selected}
                        className={[
                          'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left',
                          'font-sans text-sm transition-all duration-200 cursor-pointer',
                          'disabled:cursor-not-allowed disabled:opacity-45',
                          isRight
                            ? 'border-[#C9A45C]/70 bg-[#C9A45C]/12 text-[#FFFCF9]'
                            : isWrong
                              ? 'border-[#B83B5E]/60 bg-[#B83B5E]/10 text-[#FFFCF9]'
                              : 'border-[#E98DA3]/18 bg-white/[0.03] text-[#E4D5DB] hover:border-[#E98DA3]/45 hover:bg-white/[0.06]',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]',
                            isRight
                              ? 'border-[#C9A45C] bg-[#C9A45C] text-[#241B20]'
                              : 'border-[#E98DA3]/35 text-[#9C8490]',
                          ].join(' ')}
                          aria-hidden="true"
                        >
                          {isRight ? <Check size={13} /> : String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Chapter Two: type it ── */}
              {question.chapter === 'riddles' && question.kind === 'guess' && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <Input
                      id={`guess-${question.id}`}
                      label={question.placeholder}
                      value={guess}
                      onChange={(e) => {
                        setGuess(e.target.value);
                        if (verdict) setVerdict(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          checkGuess();
                        }
                      }}
                      disabled={!!verdict?.correct}
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={checkGuess}
                    disabled={!guess.trim() || !!verdict?.correct}
                    className="h-14 shrink-0 px-6"
                  >
                    {verdict?.correct ? 'Correct' : 'Check'}
                  </Button>
                </div>
              )}

              {/* ── Feedback: a nudge, or a warm reply ── */}
              <AnimatePresence mode="wait">
                {verdict && !verdict.correct && (
                  <motion.p
                    key={`hint-${attempts}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    className="mt-5 flex items-start gap-2 rounded-xl border border-[#E98DA3]/20 bg-[#B83B5E]/8 px-4 py-3 font-sans text-sm text-[#E98DA3]"
                  >
                    <Sparkles size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{verdict.hint || JOURNEY_COPY.wrongAnswerFallback}</span>
                  </motion.p>
                )}

                {verdict?.correct && verdict.reward && (
                  <motion.p
                    key="reward"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    className="mt-5 rounded-xl border border-[#C9A45C]/25 bg-[#C9A45C]/8 px-4 py-3 text-center text-[15px] text-[#E8C97A]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {verdict.reward}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="relative z-10 mx-auto w-full max-w-2xl pb-6 sm:pb-8 pt-4">
        {isEditMode ? (
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={index === 0 || isSaving}
              className="text-[#9C8490] hover:text-[#F4B8C9] px-6 py-2.5 rounded-full border border-white/10"
            >
              ← Back
            </Button>
            <Button
              variant="primary"
              onClick={goForward}
              isLoading={isSaving}
              disabled={!unlocked}
              className="min-w-[160px] px-8 py-3 rounded-full shadow-lg shadow-[#B83B5E]/40"
            >
              {index === questions.length - 1 ? 'Save Details ✨' : 'Continue →'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <SlideToContinue
              onComplete={goForward}
              disabled={!unlocked || isSaving}
              resetKey={question.id}
              label={question.isGateway ? 'Slide to open the door' : 'Slide to continue'}
              lockedLabel={
                question.chapter === 'setup' ? 'Fill this in to continue' : 'Answer to unlock'
              }
            />
            {index > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isSaving}
                className="mx-auto cursor-pointer font-sans text-xs text-[#9C8490]/70 transition-colors hover:text-[#F4B8C9] disabled:opacity-40"
              >
                ← one step back
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── The gateway transition ────────────────────────────────────────────────────

/**
 * The door. Dims the room, splits two panels of light apart, and says the line
 * before handing over to the birthday scene. Under reduced motion the same words
 * appear without the travel.
 */
function GatewayScene() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden">
      <JourneyBackdrop mood="night" dim petals={false} />

      {/* Two halves of a door opening onto warm light */}
      {!reduceMotion && (
        <>
          <motion.div
            className="absolute inset-y-0 left-0 z-10 w-1/2 border-r border-[#C9A45C]/25 bg-gradient-to-r from-[#150D11] to-[#2A1520]"
            initial={{ x: 0 }}
            animate={{ x: '-100%' }}
            transition={{ duration: 2.1, delay: 1.15, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 z-10 w-1/2 border-l border-[#C9A45C]/25 bg-gradient-to-l from-[#150D11] to-[#2A1520]"
            initial={{ x: 0 }}
            animate={{ x: '100%' }}
            transition={{ duration: 2.1, delay: 1.15, ease: [0.76, 0, 0.24, 1] }}
          />
          {/* Light spilling through the opening */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-1/2 z-[9] -translate-x-1/2 blur-2xl"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(232,201,122,0.5), transparent)',
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: ['0%', '70%', '110%'], opacity: [0, 0.9, 0.25] }}
            transition={{ duration: 2.6, delay: 1.15, ease: 'easeOut' }}
          />
        </>
      )}

      <div className="relative z-20 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{ duration: 2.4, times: [0, 0.2, 0.72, 1], ease: 'easeInOut' }}
          className="mx-auto max-w-md text-xl font-light text-[#E98DA3] sm:text-2xl"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {JOURNEY_COPY.gateway.line1}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.6, delay: reduceMotion ? 0.2 : 2.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-6 text-[2rem] font-light leading-tight text-[#FFFCF9] sm:text-[3rem]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {JOURNEY_COPY.gateway.line2}
        </motion.h1>
      </div>
    </div>
  );
}
