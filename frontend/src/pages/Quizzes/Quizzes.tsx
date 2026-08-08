import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Plus, Award, Sparkles, X, RotateCcw, Bot } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchQuizzes, createQuiz } from '@/services/quizzesService';
import { generateAIContent } from '@/services/aiService';
import { HumanApprovalModal } from '@/components/ui/HumanApprovalModal';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import type { Quiz } from '@/types';

export function Quizzes() {
  const { user, couple } = useAuthStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Active Quiz Taker state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // New Quiz Builder state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [questionsList, setQuestionsList] = useState<{ questionText: string; options: string[]; correctOptionIndex: number }[]>([]);

  // AI suggestion state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiDraft, setAIDraft] = useState<{ content: string; agent: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const coupleId = couple?.id || 'demo-couple';
      const data = await fetchQuizzes(coupleId);
      setQuizzes(data);
      setIsLoading(false);
    }
    loadData();
  }, [couple?.id]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setIsFinished(false);
  };

  const handleSelectOption = (index: number) => {
    if (!activeQuiz || !activeQuiz.questions) return;
    const nextAnswers = [...userAnswers, index];
    setUserAnswers(nextAnswers);

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateScore = () => {
    if (!activeQuiz || !activeQuiz.questions) return { score: 0, total: 0 };
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_option_index) score++;
    });
    return { score, total: activeQuiz.questions.length };
  };

  const handleAddQuestionToBuilder = () => {
    if (!qText.trim() || !opt0.trim() || !opt1.trim()) return;
    const opts = [opt0, opt1, opt2, opt3].filter((o) => o.trim().length > 0);
    setQuestionsList((prev) => [
      ...prev,
      {
        questionText: qText,
        options: opts,
        correctOptionIndex: correctIdx,
      },
    ]);
    setQText('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setCorrectIdx(0);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim() || questionsList.length === 0 || !user) return;

    const coupleId = couple?.id || 'demo-couple';
    const newQuiz = await createQuiz({
      coupleId,
      creatorId: user.id,
      title: quizTitle,
      description: quizDescription,
      questions: questionsList,
    });

    if (newQuiz) {
      setQuizzes((prev) => [newQuiz, ...prev]);
    }

    setQuizTitle('');
    setQuizDescription('');
    setQuestionsList([]);
    setIsBuilderOpen(false);
  };

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-[#E98DA3]/15 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1">
            <HelpCircle size={14} className="text-[#C9A45C]" />
            OUR WORLD • TRIVIA & QUIZZES
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            How Well Do You Know Us?
          </h1>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsBuilderOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Create Quiz</span>
        </Button>
      </div>

      {/* Main Quizzes List */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading trivia cards...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#E98DA3]/20">
            <FlowerAccent variant="rose" size={48} color="#E98DA3" opacity={0.3} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2">No quizzes created yet</h3>
            <p className="text-sm text-[#9C8490] font-sans mb-6">
              Create a playful trivia quiz to test your partner's memory!
            </p>
            <Button variant="primary" onClick={() => setIsBuilderOpen(true)}>
              Build First Quiz 🎉
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((q) => (
              <motion.div
                key={q.id}
                whileHover={{ y: -4 }}
                className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between hover:border-[#E98DA3]/40 bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/90"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E98DA3]/15 border border-[#E98DA3]/30 text-[#E98DA3] flex items-center justify-center">
                    <HelpCircle size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#C9A45C] font-sans">
                    {q.questions?.length || 0} Questions
                  </span>
                </div>

                <div className="mb-6">
                  <h3
                    className="text-2xl font-serif text-[#FFFCF9] mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {q.title}
                  </h3>
                  {q.description && (
                    <p className="text-xs text-[#9C8490] font-sans leading-relaxed">
                      {q.description}
                    </p>
                  )}
                </div>

                <Button variant="primary" onClick={() => handleStartQuiz(q)} className="w-full">
                  Play Quiz 🎮
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* QUIZ TAKER MODAL */}
      <AnimatePresence>
        {activeQuiz && activeQuiz.questions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-xl p-8 rounded-3xl border border-[#E98DA3]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setActiveQuiz(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X size={20} />
              </button>

              {!isFinished ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-[#C9A45C] font-sans uppercase tracking-widest">
                      Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                    </span>
                    <span className="text-xs text-[#9C8490] font-sans">
                      {activeQuiz.title}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2
                    className="text-2xl sm:text-3xl text-[#FFFCF9] font-serif mb-8"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {activeQuiz.questions[currentQuestionIndex].question_text}
                  </h2>

                  {/* Option Buttons */}
                  <div className="space-y-3">
                    {activeQuiz.questions[currentQuestionIndex].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className="w-full p-4 rounded-xl glass-card border border-white/10 hover:border-[#E98DA3] text-left text-sm font-sans text-[#FFFCF9] transition-all hover:bg-[#E98DA3]/10 flex items-center justify-between group cursor-pointer"
                      >
                        <span>{opt}</span>
                        <span className="text-xs text-[#9C8490] group-hover:text-[#E98DA3]">Select →</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* QUIZ SCORE REVEAL SCREEN */
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#B83B5E] to-[#C9A45C] flex items-center justify-center mx-auto mb-4 text-white shadow-xl">
                    <Award size={40} />
                  </div>

                  <h2
                    className="text-4xl font-serif text-[#FFFCF9] mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Quiz Complete! 🎉
                  </h2>

                  <p className="text-sm text-[#9C8490] font-sans mb-6">
                    You scored{' '}
                    <span className="text-2xl font-serif text-[#E98DA3] font-bold">
                      {calculateScore().score} / {calculateScore().total}
                    </span>{' '}
                    correct answers!
                  </p>

                  <div className="flex justify-center gap-3">
                    <Button variant="ghost" onClick={() => handleStartQuiz(activeQuiz)}>
                      <RotateCcw size={16} className="mr-1.5" /> Retry
                    </Button>
                    <Button variant="primary" onClick={() => setActiveQuiz(null)}>
                      Close Quiz
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUIZ BUILDER MODAL */}
      <AnimatePresence>
        {isBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-[#E98DA3]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <Sparkles size={20} className="text-[#C9A45C]" />
                  Build Trivia Quiz
                </h2>
                <button
                  onClick={() => setIsBuilderOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveQuiz} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Quiz Title (e.g. First Date Trivia)"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#E98DA3]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description (Optional)"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#E98DA3]"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                      Add Question #{questionsList.length + 1}
                    </p>
                    <button
                      type="button"
                      disabled={isAILoading}
                      onClick={async () => {
                        setIsAILoading(true);
                        const result = await generateAIContent({
                          intent: 'quiz_suggestion',
                          context: { topic: quizTitle || 'our couple memories' },
                        });
                        setAIDraft({ content: result.draft_content, agent: result.agent_name });
                        setIsAILoading(false);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-xs font-sans hover:bg-[#C9A45C]/25 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Bot size={12} />
                      {isAILoading ? 'Generating...' : 'AI Suggest 🤖'}
                    </button>
                  </div>

                  {/* Human Approval Modal for quiz suggestions */}
                  <HumanApprovalModal
                    isOpen={!!aiDraft}
                    agentName={aiDraft?.agent ?? ''}
                    intent="quiz_suggestion"
                    draftContent={aiDraft?.content ?? ''}
                    onApprove={(approved) => {
                      setQText(approved);
                      setAIDraft(null);
                    }}
                    onReject={() => setAIDraft(null)}
                  />
                  <input
                    type="text"
                    placeholder="Question text (e.g. Where did we first meet?)"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full bg-[#1A1015] border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#E98DA3]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option 1"
                      value={opt0}
                      onChange={(e) => setOpt0(e.target.value)}
                      className="bg-[#1A1015] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Option 2"
                      value={opt1}
                      onChange={(e) => setOpt1(e.target.value)}
                      className="bg-[#1A1015] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Option 3 (Optional)"
                      value={opt2}
                      onChange={(e) => setOpt2(e.target.value)}
                      className="bg-[#1A1015] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Option 4 (Optional)"
                      value={opt3}
                      onChange={(e) => setOpt3(e.target.value)}
                      className="bg-[#1A1015] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[#9C8490] font-sans">Correct Option Index (0 = Opt 1, 1 = Opt 2):</span>
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="bg-[#1A1015] border border-white/10 text-white rounded-lg p-1 text-xs"
                    >
                      <option value={0}>Option 1</option>
                      <option value={1}>Option 2</option>
                      <option value={2}>Option 3</option>
                      <option value={3}>Option 4</option>
                    </select>
                  </div>

                  <Button type="button" variant="ghost" onClick={handleAddQuestionToBuilder} className="w-full text-xs">
                    + Save Question ({questionsList.length} Added)
                  </Button>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsBuilderOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={questionsList.length === 0}>
                    Save Full Quiz 🎉
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
