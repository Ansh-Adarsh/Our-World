import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Gift,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/stores/toastStore';
import {
  createSurprise,
  updateSurprise,
  saveSurpriseQuestions,
} from '@/services/surpriseService';
import type {
  Surprise,
  SurpriseQuestion,
  SurpriseOccasion,
  NoButtonBehavior,
} from '@/types';

interface SurpriseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
  creatorId: string;
  recipientId: string;
  partnerName: string;
  initialSurprise?: Surprise | null;
  onSaved: (savedSurprise: Surprise) => void;
  onPreview?: (surprise: Surprise) => void;
}

const OCCASIONS: { id: SurpriseOccasion; label: string; emoji: string }[] = [
  { id: 'birthday', label: 'Birthday Celebration', emoji: '🎂' },
  { id: 'anniversary', label: 'Anniversary Milestone', emoji: '🥂' },
  { id: 'valentine', label: "Valentine's Day", emoji: '💌' },
  { id: 'proposal', label: 'Special Proposal', emoji: '💍' },
  { id: 'achievement', label: 'Big Achievement', emoji: '🌟' },
  { id: 'first_meeting', label: 'First Date / Meeting', emoji: '🌸' },
  { id: 'apology', label: 'Sweet Apology', emoji: '🧸' },
  { id: 'just_because', label: 'Just Because I Love You', emoji: '💖' },
  { id: 'custom', label: 'Custom Occasion', emoji: '✨' },
];

const BEHAVIORS: { id: NoButtonBehavior; label: string; desc: string }[] = [
  { id: 'escape', label: 'Playful Escape (Recommended)', desc: 'No button dodges away when cursor or touch gets close' },
  { id: 'normal', label: 'Normal Button', desc: 'Standard clickable button without escape physics' },
  { id: 'grow_yes', label: 'Grow Yes Button', desc: 'Yes button grows larger every time No is clicked' },
  { id: 'shake', label: 'Playful Shake', desc: 'Card shakes with an adorable loving tease' },
  { id: 'toast', label: 'Cute Toast Popup', desc: 'Shows a teasing romantic toast message' },
];

export function SurpriseEditorModal({
  isOpen,
  onClose,
  coupleId,
  creatorId,
  recipientId,
  partnerName,
  initialSurprise,
  onSaved,
  onPreview,
}: SurpriseEditorModalProps) {
  const { showToast } = useToastStore();

  const [occasion, setOccasion] = useState<SurpriseOccasion>('birthday');
  const [title, setTitle] = useState('');
  const [letterMessage, setLetterMessage] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [questions, setQuestions] = useState<
    Omit<SurpriseQuestion, 'id' | 'surprise_id'>[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSurprise) {
      setOccasion(initialSurprise.occasion);
      setTitle(initialSurprise.title);
      setLetterMessage(initialSurprise.letter_message || '');
      setMusicUrl(initialSurprise.music_url || '');
      setQuestions(
        initialSurprise.questions
          ? initialSurprise.questions.map((q, idx) => ({
              question_order: q.question_order || idx + 1,
              question_type: q.question_type || 'playful_choice',
              question_text: q.question_text,
              yes_text: q.yes_text || 'Yes ❤️',
              no_text: q.no_text || 'No 😂',
              no_button_behavior: q.no_button_behavior || 'escape',
              hint: q.hint || null,
              reveal_message: q.reveal_message || null,
            }))
          : []
      );
    } else {
      setOccasion('birthday');
      setTitle(`Special Birthday Surprise for ${partnerName}`);
      setLetterMessage(
        `Happy Birthday, ${partnerName}! Every single second by your side is a gift I will treasure for the rest of my days. ❤️`
      );
      setMusicUrl('');
      setQuestions([
        {
          question_order: 1,
          question_type: 'playful_choice',
          question_text: 'Do you love me? ❤️',
          yes_text: 'YES ❤️',
          no_text: 'NO 😏',
          no_button_behavior: 'escape',
          reveal_message: 'I knew it... ❤️',
        },
        {
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
          question_order: 3,
          question_type: 'playful_choice',
          question_text: 'Do you still remember the little moments that made us... us? 🥹❤️',
          yes_text: 'YES ❤️',
          no_text: 'NO 😏',
          no_button_behavior: 'escape',
          reveal_message: 'Every single one is locked in my heart 🌸✨',
        },
        {
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
          question_order: 7,
          question_type: 'playful_choice',
          question_text:
            'Okay... enough questions. 👀\n\nAre you ready to discover what I made for you? 🎁❤️',
          yes_text: 'YESSS! ❤️',
          no_text: 'NO 😏',
          no_button_behavior: 'escape',
          reveal_message: 'Then close your eyes for a second...\nBecause your surprise begins now. ❤️',
        },
      ]);
    }
  }, [initialSurprise, partnerName, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_order: prev.length + 1,
        question_type: 'playful_choice',
        question_text: '',
        yes_text: 'Yes ❤️',
        no_text: 'No 😂',
        no_button_behavior: 'escape',
        reveal_message: '',
      },
    ]);
  };

  const handleUpdateQuestion = (
    index: number,
    fields: Partial<Omit<SurpriseQuestion, 'id' | 'surprise_id'>>
  ) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, ...fields } : q))
    );
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((q, idx) => ({ ...q, question_order: idx + 1 }))
    );
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setQuestions(
      reordered.map((q, idx) => ({ ...q, question_order: idx + 1 }))
    );
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      showToast('Please enter a title for your surprise', 'error');
      return;
    }

    setIsSaving(true);
    try {
      let saved: Surprise;

      if (initialSurprise?.id) {
        saved = await updateSurprise(initialSurprise.id, {
          title: title.trim(),
          occasion,
          letterMessage: letterMessage.trim() || undefined,
          musicUrl: musicUrl.trim() || undefined,
          status,
        });
        const savedQ = await saveSurpriseQuestions(initialSurprise.id, questions);
        saved.questions = savedQ;
      } else {
        saved = await createSurprise({
          coupleId,
          creatorId,
          recipientId,
          occasion,
          title: title.trim(),
          letterMessage: letterMessage.trim() || undefined,
          musicUrl: musicUrl.trim() || undefined,
          status,
          questions,
        });
      }

      showToast(
        status === 'published'
          ? `Surprise published for ${partnerName}! 🎁`
          : 'Surprise draft saved safely ❤️',
        'success'
      );
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('[SurpriseEditor] Save error:', err);
      showToast(err.message || 'Failed to save surprise', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerPreview = () => {
    const previewData: Surprise = {
      id: initialSurprise?.id || 'preview-temp',
      couple_id: coupleId,
      creator_id: creatorId,
      recipient_id: recipientId,
      occasion,
      title: title.trim() || `Surprise for ${partnerName}`,
      letter_message: letterMessage.trim() || null,
      music_url: musicUrl.trim() || null,
      cover_photo_url: null,
      status: 'draft',
      is_viewed: false,
      viewed_at: null,
      questions: questions.map((q, idx) => ({
        id: `preview-q-${idx}`,
        surprise_id: 'preview-temp',
        question_order: idx + 1,
        question_type: q.question_type || 'playful_choice',
        question_text: q.question_text || 'Do you remember our first moment? ❤️',
        yes_text: q.yes_text || 'Yes ❤️',
        no_text: q.no_text || 'No 😂',
        no_button_behavior: q.no_button_behavior || 'escape',
        reveal_message: q.reveal_message || 'You mean the world to me ✨',
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (onPreview) {
      onPreview(previewData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl glass-card rounded-3xl border border-[#F4B8C9]/30 bg-[#22171E]/95 shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] flex flex-col my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#B83B5E]/20 text-[#F4B8C9]">
              <Gift size={22} />
            </div>
            <div>
              <h2
                className="text-2xl sm:text-3xl font-light text-[#FFFCF9]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {initialSurprise ? 'Edit Romantic Surprise' : 'Create Custom Surprise'}
              </h2>
              <p className="text-xs text-[#9C8490] font-sans">
                Craft a private interactive experience specifically for <span className="text-[#F4B8C9] font-medium">{partnerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9C8490] hover:text-white p-2 rounded-xl bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto space-y-6 py-6 pr-1 custom-scrollbar">
          {/* 1. Occasion Selector */}
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest text-[#E8C97A] font-semibold mb-3">
              1. Choose Occasion
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {OCCASIONS.map((occ) => {
                const isSelected = occasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccasion(occ.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#B83B5E]/25 border-[#F4B8C9] text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-[#9C8490] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{occ.emoji}</span>
                    <span className="text-xs font-sans font-medium">{occ.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Title & Message */}
          <div className="space-y-4">
            <label className="block text-xs font-sans uppercase tracking-widest text-[#E8C97A] font-semibold">
              2. Surprise Details & Romantic Letter
            </label>

            <Input
              id="surprise-title"
              label="Surprise Title"
              placeholder={`e.g. Birthday Celebration for ${partnerName}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div>
              <label className="block text-xs font-sans text-[#9C8490] mb-1.5">
                Personal Love Letter / Message
              </label>
              <textarea
                rows={4}
                className="w-full rounded-2xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-[#FFFCF9] placeholder-[#9C8490]/50 focus:outline-none focus:border-[#F4B8C9] focus:ring-1 focus:ring-[#F4B8C9] transition-all resize-none font-sans"
                placeholder={`Write an emotional letter to ${partnerName} that will be revealed at the climax of the surprise...`}
                value={letterMessage}
                onChange={(e) => setLetterMessage(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Question Builder */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-[#E8C97A] font-semibold">
                  3. Interactive Questions ({questions.length})
                </label>
                <p className="text-[11px] text-[#9C8490] font-sans">
                  Customize playful questions that {partnerName} must answer during the experience.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4B8C9]/15 border border-[#F4B8C9]/30 text-xs font-sans font-medium text-[#F4B8C9] hover:bg-[#F4B8C9]/25 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-white/15 text-center text-xs text-[#9C8490]">
                No custom questions yet. Click <span className="text-[#F4B8C9] font-medium">+ Add Question</span> to create playful beats!
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <Card
                    key={idx}
                    variant="dark"
                    className="p-4 sm:p-5 border border-white/10 bg-white/[0.03] rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-xs font-sans font-semibold text-[#E8C97A] flex items-center gap-1.5">
                        <Sparkles size={13} /> Question {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          className="p-1 rounded-lg text-[#9C8490] hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          className="p-1 rounded-lg text-[#9C8490] hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="p-1 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-400/10 cursor-pointer ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <Input
                      id={`q-text-${idx}`}
                      label="Question Text"
                      placeholder="e.g. Who fell in love first? 👀"
                      value={q.question_text}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, { question_text: e.target.value })
                      }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        id={`q-yes-${idx}`}
                        label="Yes Button Text"
                        placeholder="e.g. Obviously me ❤️"
                        value={q.yes_text}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, { yes_text: e.target.value })
                        }
                      />
                      <Input
                        id={`q-no-${idx}`}
                        label="No Button Text"
                        placeholder="e.g. You wish 😂"
                        value={q.no_text}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, { no_text: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-sans text-[#9C8490] mb-1">
                          No-Button Behavior
                        </label>
                        <select
                          className="w-full rounded-xl bg-[#1C1418] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4B8C9] font-sans"
                          value={q.no_button_behavior}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              no_button_behavior: e.target.value as NoButtonBehavior,
                            })
                          }
                        >
                          {BEHAVIORS.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.label} — {b.desc}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        id={`q-reveal-${idx}`}
                        label="Reveal / Teasing Message"
                        placeholder="e.g. It was true love from day one ✨"
                        value={q.reveal_message || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, { reveal_message: e.target.value })
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleTriggerPreview}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-[#FFFCF9] hover:bg-white/10 transition-colors cursor-pointer font-sans"
          >
            <Eye size={15} />
            <span>Preview Cinematic</span>
          </button>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
              className="text-xs"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              variant="primary"
              isLoading={isSaving}
              onClick={() => handleSave('published')}
              className="flex items-center gap-2 text-xs"
            >
              <Send size={14} />
              <span>Publish for {partnerName}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
