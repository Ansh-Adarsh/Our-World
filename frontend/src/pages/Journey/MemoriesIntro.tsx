/**
 * MemoriesIntro — the last chapter of the journey.
 *
 * Sits deliberately between the birthday surprise and the dashboard so the story
 * does not just stop: the surprise ends, the journey looks back over everything
 * already saved, and only then does the app itself open.
 *
 * Two stages, and which one you land on comes from the database:
 *   birthday_completed  → the intro ("Before we go further…")
 *   memories_completed  → straight to the gallery, because that part is done
 *
 * The final CTA is the only thing that writes `completed`, which is also the
 * moment the bottom navigation and the rest of the app become reachable.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Calendar, MapPin, Images, ArrowRight } from 'lucide-react';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { JourneyBackdrop } from '@/components/journey/JourneyBackdrop';
import { HeartBurst } from '@/components/journey/JourneyParticles';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { fetchMemories } from '@/services/memoriesService';
import { JOURNEY_PATHS } from '@/routes/journeyRoutes';
import { MEMORIES_INTRO } from '@/content/journey';
import type { Memory } from '@/types';

type Stage = 'intro' | 'gallery';

export function MemoriesIntro() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { couple, onboardingStatus, advanceJourney } = useAuthStore();

  // Resume: the intro is already behind them once the status has moved on.
  const [stage, setStage] = useState<Stage>(
    onboardingStatus === 'memories_completed' ? 'gallery' : 'intro',
  );
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [burst, setBurst] = useState(0);

  const coupleId = couple?.id || 'demo-couple';

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void fetchMemories(coupleId).then((rows) => {
      if (!active) return;
      setMemories(rows);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [coupleId]);

  // Oldest first: the gallery should read like a walk forward through time.
  const timeline = useMemo(
    () =>
      [...memories].sort(
        (a, b) => new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime(),
      ),
    [memories],
  );

  const openGallery = async () => {
    setStage('gallery');
    setBurst((n) => n + 1);
    await advanceJourney('memories_completed');
  };

  const enterOurWorld = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    await advanceJourney('completed');
    navigate(JOURNEY_PATHS.dashboard, { replace: true });
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-9 sm:px-8 sm:py-12">
      <JourneyBackdrop mood="calm" petals={stage === 'intro'} />

      <AnimatePresence mode="wait">
        {/* ── Intro ── */}
        {stage === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 m-auto w-full max-w-lg text-center"
          >
            <p className="caption-gold mb-6">{MEMORIES_INTRO.eyebrow}</p>

            <FlowerAccent
              variant="petal"
              size={58}
              color="#E98DA3"
              opacity={0.35}
              className="mb-6 inline-block"
            />

            <h1
              className="mb-3 text-[2rem] font-light leading-tight text-[#FFFCF9] sm:text-[2.6rem]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {MEMORIES_INTRO.title}
            </h1>

            <p
              className="mb-7 text-lg text-[#E98DA3] sm:text-xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {MEMORIES_INTRO.subtitle}
            </p>

            <p className="mx-auto mb-10 max-w-md font-sans text-sm leading-relaxed text-[#9C8490]">
              {MEMORIES_INTRO.body}
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={openGallery}
              className="min-h-[52px] w-full max-w-xs tracking-widest uppercase sm:w-auto"
              autoFocus
            >
              {MEMORIES_INTRO.cta}
            </Button>
          </motion.div>
        )}

        {/* ── Gallery ── */}
        {stage === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 mx-auto w-full max-w-2xl"
          >
            <div className="relative mb-9 text-center">
              <HeartBurst trigger={burst} count={10} />
              <h1
                className="mb-2 text-[1.8rem] font-light leading-tight text-[#FFFCF9] sm:text-[2.4rem]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {MEMORIES_INTRO.galleryTitle}
              </h1>
              <p className="font-sans text-sm text-[#9C8490]">{MEMORIES_INTRO.gallerySubtitle}</p>
            </div>

            {isLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading memories">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[86px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
                  />
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div className="glass-card border border-[#E98DA3]/15 p-8 text-center">
                <Images size={26} className="mx-auto mb-4 text-[#E98DA3]/50" aria-hidden="true" />
                <h2
                  className="mb-2 text-xl font-light text-[#FFFCF9]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {MEMORIES_INTRO.emptyTitle}
                </h2>
                <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-[#9C8490]">
                  {MEMORIES_INTRO.emptyBody}
                </p>
              </div>
            ) : (
              /* A single vertical thread with a node per memory */
              <ol className="relative space-y-3 pl-6 sm:pl-8">
                <span
                  className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-[#B83B5E]/50 via-[#E98DA3]/30 to-transparent sm:left-[11px]"
                  aria-hidden="true"
                />

                {timeline.map((memory, i) => (
                  <motion.li
                    key={memory.id}
                    initial={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, delay: Math.min(i * 0.07, 0.7) }}
                    className="relative"
                  >
                    <span
                      className="absolute -left-6 top-6 h-[9px] w-[9px] rounded-full border border-[#E98DA3]/50 bg-[#B83B5E] sm:-left-8"
                      aria-hidden="true"
                    />

                    <article className="glass-card border border-[#E98DA3]/12 p-4 sm:p-5">
                      <h3
                        className="mb-1.5 text-lg font-light text-[#FFFCF9] sm:text-xl"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {memory.title}
                      </h3>

                      {memory.description && (
                        <p className="mb-3 line-clamp-2 font-sans text-[13px] leading-relaxed text-[#E4D5DB]/75">
                          {memory.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[11px] text-[#9C8490]">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} aria-hidden="true" />
                          {formatMemoryDate(memory.memory_date)}
                        </span>
                        {memory.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} aria-hidden="true" />
                            {memory.location}
                          </span>
                        )}
                        {!!memory.photos?.length && (
                          <span className="flex items-center gap-1.5">
                            <Images size={12} aria-hidden="true" />
                            {memory.photos.length} photo{memory.photos.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </article>
                  </motion.li>
                ))}
              </ol>
            )}

            <div className="mt-10 text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={enterOurWorld}
                isLoading={isFinishing}
                className="min-h-[52px] w-full max-w-sm sm:w-auto"
              >
                {MEMORIES_INTRO.finalCta}
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "12 March 2024" — long enough to feel like a date you would remember. */
function formatMemoryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
