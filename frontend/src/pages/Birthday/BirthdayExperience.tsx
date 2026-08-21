import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { fetchMemories } from '@/services/memoriesService';
import { fetchPlaylistSongs } from '@/services/playlistService';
import { SceneIntro } from './scenes/SceneIntro';
import { SceneFlowers } from './scenes/SceneFlowers';
import { ScenePhotos } from './scenes/ScenePhotos';
import { SceneTimeline } from './scenes/SceneTimeline';
import { SceneLetter } from './scenes/SceneLetter';
import { SceneMusic } from './scenes/SceneMusic';
import { SceneFinal } from './scenes/SceneFinal';
import { X, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Step = 'intro' | 'flowers' | 'photos' | 'timeline' | 'letter' | 'music' | 'final';

export function BirthdayExperience() {
  const navigate = useNavigate();
  const { couple } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [memoryPhotos, setMemoryPhotos] = useState<{ id: string; url: string; title: string; caption?: string; date?: string }[]>([]);
  const [topSong, setTopSong] = useState<{ title: string; artist: string; link?: string; note?: string } | undefined>(undefined);

  const partnerName = couple?.partner_name || 'My Love';

  useEffect(() => {
    async function loadCoupleData() {
      const coupleId = couple?.id;
      if (!coupleId) return;
      
      try {
        // Load memories for photos
        const mems = await fetchMemories(coupleId);
        const extractedPhotos: { id: string; url: string; title: string; caption?: string; date?: string }[] = [];
        mems.forEach((m) => {
          if (m.photos && m.photos.length > 0) {
            m.photos.forEach((p, idx) => {
              const validUrl = p.signed_url || (p.storage_path && (p.storage_path.startsWith('http') || p.storage_path.startsWith('data:')) ? p.storage_path : '');
              if (validUrl) {
                extractedPhotos.push({
                  id: `${m.id}-${idx}`,
                  url: validUrl,
                  title: m.title,
                  caption: p.caption || m.description || undefined,
                  date: new Date(m.memory_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
                });
              }
            });
          }
        });
        setMemoryPhotos(extractedPhotos);

        // Load top song from playlist
        const songs = await fetchPlaylistSongs(coupleId);
        if (songs.length > 0) {
          setTopSong({
            title: songs[0].title,
            artist: songs[0].artist,
            link: songs[0].audio_url || songs[0].link_url || undefined,
            note: songs[0].note || undefined,
          });
        }
      } catch (err) {
        console.error('[BirthdayExperience] loadCoupleData error:', err);
      }
    }

    loadCoupleData();
  }, [couple?.id, couple?.partner_name]);

  const steps: Step[] = ['intro', 'flowers', 'photos', 'timeline', 'letter', 'music', 'final'];
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
      {/* Top Header Control bar */}
      <div className="absolute top-4 inset-x-4 z-40 flex items-center justify-between pointer-events-auto">
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

        {/* Step progress dots */}
        <div className="flex gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          {steps.map((s, idx) => (
            <button
              key={s}
              onClick={() => setCurrentStep(s)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-[#C9A45C]' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => navigate('/home')}
          className="p-2 rounded-full bg-white/10 border border-white/15 text-[#9C8490] hover:text-white transition-colors cursor-pointer backdrop-blur-md"
          title="Exit Birthday Experience"
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
          {currentStep === 'intro' && <SceneIntro partnerName={partnerName} onNext={goNext} />}
          {currentStep === 'flowers' && <SceneFlowers onNext={goNext} />}
          {currentStep === 'photos' && <ScenePhotos photos={memoryPhotos} onNext={goNext} />}
          {currentStep === 'timeline' && <SceneTimeline events={[]} onNext={goNext} />}
          {currentStep === 'letter' && <SceneLetter partnerName={partnerName} onNext={goNext} />}
          {currentStep === 'music' && <SceneMusic topSong={topSong} onNext={goNext} />}
          {currentStep === 'final' && (
            <SceneFinal partnerName={partnerName} onRestart={() => setCurrentStep('intro')} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
