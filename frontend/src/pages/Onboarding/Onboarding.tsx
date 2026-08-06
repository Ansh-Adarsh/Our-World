import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowerAccent, FloatingPetals } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { saveOnboardingData } from '@/services/onboardingService';
import { createCouple } from '@/services/api';

interface OnboardingQuestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'text' | 'date' | 'partner_details' | 'textarea';
}

const QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'couple_name',
    title: 'What shall we call our world?',
    subtitle: 'Give your shared universe a title or pet name',
    type: 'text',
  },
  {
    id: 'anniversary_date',
    title: 'When did your story begin?',
    subtitle: 'Your anniversary date powers your "Days Together" live counter',
    type: 'date',
  },
  {
    id: 'partner_details',
    title: 'Tell us about your partner',
    subtitle: "Their name and birthday so we can build your cinematic countdown",
    type: 'partner_details',
  },
  {
    id: 'first_memory',
    title: 'A favorite memory or promise',
    subtitle: 'What is one thing that always makes you smile when you think of them?',
    type: 'textarea',
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { user, couple, loadCouple } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [coupleName, setCoupleName] = useState(couple?.couple_name || '');
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversary_date || '');
  const [partnerName, setPartnerName] = useState(couple?.partner_name || '');
  const [partnerBirthday, setPartnerBirthday] = useState(couple?.partner_birthday || '');
  const [favoriteMemory, setFavoriteMemory] = useState('');

  const currentQ = QUESTIONS[currentStep];
  const progressPercent = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleNext = async () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Finish Onboarding
      setIsSubmitting(true);
      try {
        let activeCoupleId = couple?.id;

        // Auto-create couple if missing
        if (!activeCoupleId && user) {
          try {
            const newCouple = await createCouple({ couple_name: coupleName, anniversary_date: anniversaryDate });
            activeCoupleId = newCouple.couple_id;
          } catch {
            activeCoupleId = 'local-couple-id';
          }
        }

        if (user && activeCoupleId) {
          await saveOnboardingData({
            coupleId: activeCoupleId,
            userId: user.id,
            coupleName,
            anniversaryDate,
            partnerName,
            partnerBirthday,
            answers: {
              first_memory: favoriteMemory,
            },
          });
        }

        await loadCouple();
        navigate('/home', { replace: true });
      } catch (err) {
        console.error('[Onboarding] Error submitting onboarding:', err);
        navigate('/home', { replace: true });
      } finally {
        setIsSubmitting(false);
      }
    };
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-between overflow-hidden bg-our-world px-6 py-8 sm:px-12 sm:py-12">
      <FloatingPetals color="#E98DA3" />

      {/* Top Header & Progress Bar */}
      <div className="relative z-10 w-full max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-sm font-serif text-[#E98DA3]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            OUR WORLD • ONBOARDING
          </span>
          <span className="text-xs font-sans text-[#9C8490]">
            Step {currentStep + 1} of {QUESTIONS.length}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#B83B5E] via-[#E98DA3] to-[#C9A45C]"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Center Question Card */}
      <div className="relative z-10 w-full max-w-xl mx-auto my-auto py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-card p-8 sm:p-10 relative overflow-hidden border border-[#E98DA3]/20"
          >
            <FlowerAccent
              variant="rose" size={48} color="#E98DA3" opacity={0.15}
              className="absolute top-4 right-4"
            />

            <h2
              className="text-3xl sm:text-4xl text-[#FFFCF9] font-light mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {currentQ.title}
            </h2>
            <p className="text-sm text-[#9C8490] font-sans mb-8 leading-relaxed">
              {currentQ.subtitle}
            </p>

            {/* Render input by type */}
            {currentQ.type === 'text' && (
              <Input
                id="couple-name-input"
                label="Couple / Relationship Title"
                placeholder="e.g. Maya & Alex's Sanctuary"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                autoFocus
              />
            )}

            {currentQ.type === 'date' && (
              <Input
                id="anniversary-date-input"
                type="date"
                label="Anniversary Date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                autoFocus
              />
            )}

            {currentQ.type === 'partner_details' && (
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

            {currentQ.type === 'textarea' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                  Your Special Memory / Promise
                </label>
                <textarea
                  id="favorite-memory-input"
                  rows={4}
                  className="w-full bg-[#1A1015]/80 border border-[#E98DA3]/20 rounded-xl p-4 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#B83B5E] transition-colors placeholder-[#9C8490]/50"
                  placeholder="e.g. When we stayed up all night talking under the stars..."
                  value={favoriteMemory}
                  onChange={(e) => setFavoriteMemory(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Controls */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="text-[#9C8490] hover:text-[#FFFCF9]"
        >
          Back
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          isLoading={isSubmitting}
          className="min-w-[140px]"
        >
          {currentStep === QUESTIONS.length - 1 ? 'Enter Our World ❤️' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
