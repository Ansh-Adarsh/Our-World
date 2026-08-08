import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, Plus, CheckCircle, Clock, Sparkles, X, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchUnderstandingEntries, createUnderstandingEntry, updateUnderstandingStatus } from '@/services/understandingService';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UnderstandingEntry } from '@/types';

export function UnderstandingCorner() {
  const { user, couple } = useAuthStore();
  const [entries, setEntries] = useState<UnderstandingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<UnderstandingEntry | null>(null);

  // Form State
  const [topic, setTopic] = useState('');
  const [myPerspective, setMyPerspective] = useState('');
  const [partnerPerspectiveSummary, setPartnerPerspectiveSummary] = useState('');
  const [proposedResolution, setProposedResolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const coupleId = couple?.id || 'demo-couple';
      const data = await fetchUnderstandingEntries(coupleId);
      setEntries(data);
      setIsLoading(false);
    }
    loadData();
  }, [couple?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !myPerspective.trim() || !user) return;

    setIsSubmitting(true);
    const coupleId = couple?.id || 'demo-couple';

    const newEntry = await createUnderstandingEntry({
      coupleId,
      userId: user.id,
      topic,
      myPerspective,
      partnerPerspectiveSummary,
      proposedResolution,
    });

    if (newEntry) {
      setEntries((prev) => [newEntry, ...prev]);
    }

    setTopic('');
    setMyPerspective('');
    setPartnerPerspectiveSummary('');
    setProposedResolution('');
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleResolve = async (id: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'resolved' } : item))
    );
    if (selectedEntry?.id === id) {
      setSelectedEntry((prev) => (prev ? { ...prev, status: 'resolved' } : null));
    }
    await updateUnderstandingStatus(id, 'resolved');
  };

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[#5A2435]/25 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1">
            <HeartHandshake size={14} className="text-[#C9A45C]" />
            OUR WORLD • UNDERSTANDING CORNER
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Calm Resolution & Empathy Space
          </h1>
        </div>

        <Button
          variant="gold"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Entry</span>
        </Button>
      </div>

      {/* Non-Blame Framing Banner */}
      <div className="relative z-10 mb-8 p-4 rounded-2xl glass-card border-[#C9A45C]/30 bg-[#C9A45C]/10 text-xs sm:text-sm text-[#FFF8F2] flex items-center gap-3 shadow-xl">
        <ShieldAlert size={20} className="text-[#C9A45C] shrink-0" />
        <p className="font-sans leading-relaxed">
          <strong className="text-[#C9A45C]">Principles of this space:</strong> Use "I feel" statements instead of blame. State your perspective with honesty, summarize your partner's view with empathy, and craft shared resolutions together.
        </p>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Opening understanding log...
          </div>
        ) : entries.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#C9A45C]/20">
            <FlowerAccent variant="rose" size={48} color="#C9A45C" opacity={0.3} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2">No entries logged</h3>
            <p className="text-sm text-[#9C8490] font-sans mb-6">
              Use this safe space whenever you want to work through a disagreement calmly.
            </p>
            <Button variant="gold" onClick={() => setIsModalOpen(true)}>
              Start Structured Reflection 🕊️
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => {
              const isResolved = entry.status === 'resolved';
              return (
                <motion.div
                  key={entry.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedEntry(entry)}
                  className={`glass-card p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-[#C9A45C] transition-all bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/90 ${
                    isResolved ? 'border-[#C9A45C]/20 opacity-90' : 'border-[#E98DA3]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full border uppercase flex items-center gap-1 ${
                        isResolved
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#C9A45C]/20 border-[#C9A45C]/40 text-[#C9A45C]'
                      }`}
                    >
                      {isResolved ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {entry.status}
                    </span>
                    <span className="text-[10px] text-[#9C8490]">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3
                      className="text-2xl font-serif text-[#FFFCF9] mb-3"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {entry.topic}
                    </h3>
                    <p className="text-xs text-[#9C8490] font-sans line-clamp-3 leading-relaxed">
                      "{entry.my_perspective}"
                    </p>
                  </div>

                  {entry.proposed_resolution && (
                    <div className="p-3 rounded-xl bg-black/40 border border-[#C9A45C]/30 text-xs text-[#C9A45C] font-sans mb-4">
                      <strong>Resolution:</strong> {entry.proposed_resolution}
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/5 text-right text-xs text-[#C9A45C] font-sans">
                    View reflection →
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#C9A45C]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <Sparkles size={20} className="text-[#C9A45C]" />
                  Log Structured Reflection
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  id="understanding-topic"
                  label="Topic / Situation"
                  placeholder="e.g. Work schedule & quality time balance"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    My Perspective ("I feel...")
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#C9A45C] placeholder-[#9C8490]/50"
                    placeholder="Express how you feel without blaming..."
                    value={myPerspective}
                    onChange={(e) => setMyPerspective(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Partner's Perspective (Summary with empathy)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#C9A45C] placeholder-[#9C8490]/50"
                    placeholder="How do you understand your partner's view?"
                    value={partnerPerspectiveSummary}
                    onChange={(e) => setPartnerPerspectiveSummary(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Proposed Shared Resolution
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#C9A45C] placeholder-[#9C8490]/50"
                    placeholder="What agreement can we make moving forward?"
                    value={proposedResolution}
                    onChange={(e) => setProposedResolution(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gold" type="submit" isLoading={isSubmitting}>
                    Save Reflection 🕊️
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl p-8 rounded-3xl border border-[#C9A45C]/30 bg-[#241B20]/95 max-h-[85vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X size={20} />
              </button>

              <h2
                className="text-3xl font-serif text-[#FFFCF9] mb-4"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {selectedEntry.topic}
              </h2>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-[#1A1015]/80 border border-white/10">
                  <p className="text-xs text-[#C9A45C] font-sans uppercase tracking-widest mb-1">My Perspective</p>
                  <p className="text-sm text-[#FFFCF9] font-sans leading-relaxed">{selectedEntry.my_perspective}</p>
                </div>

                {selectedEntry.partner_perspective_summary && (
                  <div className="p-4 rounded-xl bg-[#1A1015]/80 border border-white/10">
                    <p className="text-xs text-[#E98DA3] font-sans uppercase tracking-widest mb-1">Partner's View Summary</p>
                    <p className="text-sm text-[#FFFCF9] font-sans leading-relaxed">{selectedEntry.partner_perspective_summary}</p>
                  </div>
                )}

                {selectedEntry.proposed_resolution && (
                  <div className="p-4 rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-[#C9A45C]">
                    <p className="text-xs font-sans uppercase tracking-widest mb-1">Shared Resolution</p>
                    <p className="text-sm text-[#FFFCF9] font-sans leading-relaxed">{selectedEntry.proposed_resolution}</p>
                  </div>
                )}
              </div>

              {selectedEntry.status !== 'resolved' && (
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <Button variant="gold" onClick={() => handleResolve(selectedEntry.id)}>
                    Mark as Resolved & Peace Achieved 🕊️
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
