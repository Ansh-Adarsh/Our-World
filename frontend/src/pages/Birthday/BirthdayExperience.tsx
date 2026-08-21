import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { fetchMemories } from '@/services/memoriesService';
import { fetchPlaylistSongs } from '@/services/playlistService';
import {
  fetchSurpriseById,
  fetchActivePublishedSurprise,
  markSurpriseViewed,
} from '@/services/surpriseService';
import { SceneIntro } from './scenes/SceneIntro';
import { SceneQuestions } from './scenes/SceneQuestions';
import { SceneReveal } from './scenes/SceneReveal';
import { SceneCake } from './scenes/SceneCake';
import { SceneFlowers } from './scenes/SceneFlowers';
import { ScenePhotos } from './scenes/ScenePhotos';
import { SceneTimeline } from './scenes/SceneTimeline';
import { SceneLetter } from './scenes/SceneLetter';
import { SceneMusic } from './scenes/SceneMusic';
import { SceneFinal } from './scenes/SceneFinal';
import { X, ChevronLeft, Eye } from 'lucide-react';
import type { Surprise, SurpriseQuestion } from '@/types';

type Step =
  | 'intro'
  | 'questions'
  | 'reveal'
  | 'cake'
  | 'flowers'
  | 'photos'
  | 'timeline'
  | 'letter'
  | 'music'
  | 'final';

export const DEFAULT_QUESTIONS: SurpriseQuestion[] = [
  {
    id: 'default-q-1',
    surprise_id: 'default',
    question_order: 1,
    question_type: 'playful_choice',
    question_text: 'Do you love me? ❤️',
    yes_text: 'YES ❤️',
    no_text: 'NO 😏',
    no_button_behavior: 'escape',
    reveal_message: 'I knew it... ❤️',
  },
  {
    id: 'default-q-2',
    surprise_id: 'default',
    question_order: 2,
    question_type: 'playful_choice',
    question_text:
      'If you had to choose one person to annoy for the rest of your life... would you choose me? 😌❤️',
    yes_text: 'YES, obviously! ❤️',
    no_text: 'NO 😏',
    no_button_behavior: 'escape',
    reveal_message: "Good choice, you're stuck with me forever 😂❤️",
  },
  {
    id: 'default-q-3',
    surprise_id: 'default',
    question_order: 3,
    question_type: 'playful_choice',
    question_text: 'Do you still remember the little moments that made us... us? 🥹❤️',
    yes_text: 'YES ❤️',
    no_text: 'NO 😏',
    no_button_behavior: 'escape',
    reveal_message: 'Every single one is locked in my heart 🌸✨',
  },
  {
    id: 'default-q-4',
    surprise_id: 'default',
    question_order: 4,
    question_type: 'playful_choice',
    question_text:
      'If life gave you a thousand different paths... would you still choose the one that leads to me? 🥹❤️',
    yes_text: 'YES, always ❤️',
    no_text: 'NO 😏',
    no_button_behavior: 'escape',
    reveal_message: "Then we're going the right way... ❤️",
  },
  {
    id: 'default-q-5',
    surprise_id: 'default',
    question_order: 5,
    question_type: 'playful_choice',
    question_text:
      "Would you still choose me when we're old, grey, and still arguing about absolutely nothing? 👴🏻👵🏻❤️",
    yes_text: 'YES, forever ❤️',
    no_text: 'NO 😏',
    no_button_behavior: 'escape',
    reveal_message: "Good... because I'm not going anywhere. ❤️",
  },
  {
    id: 'default-q-6',
    surprise_id: 'default',
    question_order: 6,
    question_type: 'playful_choice',
    question_text:
      'One last serious question...\nWill you keep choosing me, again and again, for all the days ahead? 💍❤️',
    yes_text: 'YES ❤️',
    no_text: 'NO 😏',
    no_button_behavior: 'escape',
    reveal_message: "I was hoping you'd say that... ❤️",
  },
  {
    id: 'default-q-7',
    surprise_id: 'default',
    question_order: 7,
    question_type: 'playful_choice',
    question_text:
      'Okay... enough questions. 👀\n\nAre you ready to discover what I made for you? 🎁❤️',
    yes_text: 'YESSS! ❤️',
    no_text: 'NO 😏',
    no_button_behavior: 'escape',
    reveal_message: 'Then close your eyes for a second...\nBecause your surprise begins now. ❤️',
  },
];

export function BirthdayExperience() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const surpriseIdParam = searchParams.get('surpriseId');
  const isPreview = searchParams.get('preview') === 'true';

  const { user, couple } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [surprise, setSurprise] = useState<Surprise | null>(null);
  const [memoryPhotos, setMemoryPhotos] = useState<
    { id: string; url: string; title: string; caption?: string; date?: string }[]
  >([]);
  const [playlistSongs, setPlaylistSongs] = useState<
    { title: string; artist: string; link?: string; note?: string }[]
  >([]);

  const partnerName = couple?.partner_name || 'My Love';

  useEffect(() => {
    async function loadData() {
      const coupleId = couple?.id;
      if (!coupleId) return;

      try {
        // 1. Load Surprise (either specific by ID or active published for this user)
        if (surpriseIdParam) {
          const s = await fetchSurpriseById(surpriseIdParam);
          if (s) {
            setSurprise(s);
            if (!isPreview && s.recipient_id === user?.id) {
              void markSurpriseViewed(s.id);
            }
          }
        } else if (user?.id) {
          const activeS = await fetchActivePublishedSurprise(coupleId, user.id);
          if (activeS) {
            setSurprise(activeS);
            if (!isPreview) {
              void markSurpriseViewed(activeS.id);
            }
          }
        }

        // 2. Load memories for photos
        const mems = await fetchMemories(coupleId);
        const extractedPhotos: {
          id: string;
          url: string;
          title: string;
          caption?: string;
          date?: string;
        }[] = [];

        mems.forEach((m) => {
          if (m.photos && m.photos.length > 0) {
            m.photos.forEach((p, idx) => {
              const validUrl =
                p.signed_url ||
                (p.storage_path &&
                (p.storage_path.startsWith('http') ||
                  p.storage_path.startsWith('data:'))
                  ? p.storage_path
                  : '');
              if (validUrl) {
                extractedPhotos.push({
                  id: `${m.id}-${idx}`,
                  url: validUrl,
                  title: m.title,
                  caption: p.caption || m.description || undefined,
                  date: new Date(m.memory_date).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  }),
                });
              }
            });
          }
        });
        setMemoryPhotos(extractedPhotos);

        // 3. Load all songs from playlist
        const songs = await fetchPlaylistSongs(coupleId);
        if (songs.length > 0) {
          const mappedSongs = songs.map((s) => ({
            title: s.title,
            artist: s.artist,
            link: s.audio_url || s.link_url || undefined,
            note: s.note || undefined,
          }));
          setPlaylistSongs(mappedSongs);
        }
      } catch (err) {
        console.error('[BirthdayExperience] loadData error:', err);
      }
    }

    loadData();
  }, [couple?.id, surpriseIdParam, isPreview, user?.id]);

  const activeQuestions =
    surprise?.questions && surprise.questions.length > 0
      ? surprise.questions
      : DEFAULT_QUESTIONS;

  const steps: Step[] = [
    'intro',
    'questions',
    'reveal',
    'cake',
    'flowers',
    'photos',
    'timeline',
    'letter',
    'music',
    'final',
  ];

  const currentIndex = steps.indexOf(currentStep);

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#140D11] text-[#FFFCF9] overflow-hidden select-none">
      {/* Preview Mode Banner */}
      {isPreview && (
        <div className="absolute top-0 inset-x-0 z-50 py-1.5 bg-[#B83B5E] text-white text-[11px] font-sans font-medium text-center flex items-center justify-center gap-1.5 shadow-md">
          <Eye size={13} />
          <span>Creator Preview Mode — Experience how {partnerName} will interact with this</span>
        </div>
      )}

      {/* Top Header Control bar */}
      <div
        className={`absolute inset-x-4 z-40 flex items-center justify-between pointer-events-auto ${
          isPreview ? 'top-10' : 'top-4'
        }`}
      >
        {currentIndex > 0 ? (
          <button
            onClick={goPrev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-[#9C8490] hover:text-white transition-colors cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {/* Step progress dots — Clickable to jump to any beat */}
        <div className="flex gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          {steps.map((s, idx) => (
            <button
              key={s}
              onClick={() => setCurrentStep(s)}
              title={`Jump to ${s}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-[#C9A45C]' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => navigate('/home')}
          className="p-2 rounded-full bg-white/10 border border-white/15 text-[#9C8490] hover:text-white transition-colors cursor-pointer backdrop-blur-md"
          title="Exit Surprise Experience"
        >
          <X size={18} />
        </button>
      </div>

      {/* Animated Scene Transition Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full h-full"
        >
          {currentStep === 'intro' && (
            <SceneIntro partnerName={partnerName} onNext={goNext} />
          )}

          {currentStep === 'questions' && (
            <SceneQuestions
              questions={activeQuestions}
              partnerName={partnerName}
              onNext={goNext}
            />
          )}

          {currentStep === 'reveal' && (
            <SceneReveal partnerName={partnerName} onNext={goNext} />
          )}

          {currentStep === 'cake' && (
            <SceneCake partnerName={partnerName} onNext={goNext} />
          )}

          {currentStep === 'flowers' && <SceneFlowers onNext={goNext} />}

          {currentStep === 'photos' && (
            <ScenePhotos photos={memoryPhotos} onNext={goNext} />
          )}

          {currentStep === 'timeline' && (
            <SceneTimeline events={[]} onNext={goNext} />
          )}

          {currentStep === 'letter' && (
            <SceneLetter
              partnerName={partnerName}
              customMessage={surprise?.letter_message}
              onNext={goNext}
            />
          )}

          {currentStep === 'music' && (
            <SceneMusic songs={playlistSongs} onNext={goNext} />
          )}

          {currentStep === 'final' && (
            <SceneFinal
              partnerName={partnerName}
              finalMessage={surprise?.letter_message}
              onRestart={() => setCurrentStep('intro')}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
