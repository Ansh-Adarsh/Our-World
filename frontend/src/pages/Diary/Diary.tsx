import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Heart, Lock, Sparkles, X, Calendar, Eye, Edit2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { fetchDiaryEntries, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from '@/services/diaryService';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import type { DiaryEntry, DiaryVisibility } from '@/types';

const MOODS = ['💖', '🌅', '😊', '🍷', '🌟', '🎁', '🌙', '📖', '🕊️'];

export function Diary() {
  const { user, couple } = useAuthStore();
  const { showToast } = useToastStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SHARED' | 'PRIVATE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('💖');
  const [visibility, setVisibility] = useState<DiaryVisibility>('SHARED');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coupleId = couple?.id;

  useEffect(() => {
    async function loadData() {
      if (!user || !coupleId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await fetchDiaryEntries(coupleId, user.id);
        setEntries(data);
      } catch (err) {
        console.error('[Diary] Load data error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [coupleId, user]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filter === 'SHARED') return e.visibility === 'SHARED';
      if (filter === 'PRIVATE') return e.visibility === 'PRIVATE';
      return true;
    });
  }, [entries, filter]);

  const openCreateModal = () => {
    setEditingEntry(null);
    setTitle('');
    setContent('');
    setMood('💖');
    setVisibility('SHARED');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: DiaryEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || '💖');
    setVisibility(entry.visibility);
    setEntryDate(entry.entry_date);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user || !coupleId) return;

    setIsSubmitting(true);
    try {
      if (editingEntry) {
        const updated = await updateDiaryEntry(editingEntry.id, {
          title,
          content,
          mood,
          visibility,
          entryDate,
        });
        setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        if (selectedEntry?.id === updated.id) setSelectedEntry(updated);
        showToast('Diary entry updated 💖', 'success');
      } else {
        const newEntry = await createDiaryEntry({
          coupleId,
          userId: user.id,
          title,
          content,
          mood,
          visibility,
          entryDate,
        });
        setEntries((prev) => [newEntry, ...prev]);
        showToast('Diary entry saved 📖', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = confirm('Are you sure you want to delete this diary entry?');
    if (!ok) return;

    try {
      await deleteDiaryEntry(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
      if (selectedEntry?.id === id) setSelectedEntry(null);
      showToast('Diary entry deleted', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete entry', 'error');
    }
  };

  return (
    <PageContainer>
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[#5A2435]/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#C9A45C]/10 blur-3xl" />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
            OUR WORLD • DIARY
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Notebook & Personal Journal
          </h1>
        </div>

        <Button
          variant="gold"
          onClick={openCreateModal}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Entry</span>
        </Button>
      </div>

      {/* Filter Tabs & Privacy Guarantee Banner */}
      <div className="relative z-10 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 w-fit">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors ${
              filter === 'ALL' ? 'bg-[#E98DA3]/20 text-[#FFFCF9] border border-[#E98DA3]/30' : 'text-[#9C8490]'
            }`}
          >
            All Entries ({entries.length})
          </button>
          <button
            onClick={() => setFilter('SHARED')}
            className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors flex items-center gap-1.5 ${
              filter === 'SHARED' ? 'bg-[#E98DA3]/20 text-[#FFFCF9] border border-[#E98DA3]/30' : 'text-[#9C8490]'
            }`}
          >
            <Heart size={12} className="text-[#E98DA3]" />
            Shared ({entries.filter((e) => e.visibility === 'SHARED').length})
          </button>
          <button
            onClick={() => setFilter('PRIVATE')}
            className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors flex items-center gap-1.5 ${
              filter === 'PRIVATE' ? 'bg-[#C9A45C]/20 text-[#C9A45C] border border-[#C9A45C]/30' : 'text-[#9C8490]'
            }`}
          >
            <Lock size={12} className="text-[#C9A45C]" />
            My Private ({entries.filter((e) => e.visibility === 'PRIVATE').length})
          </button>
        </div>

        <div className="text-xs text-[#9C8490] font-sans flex items-center gap-1.5">
          <Lock size={12} className="text-[#C9A45C]" />
          <span>RLS Protected • Private entries readable ONLY by author</span>
        </div>
      </div>

      {/* Notebook Entries Grid */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Opening your journal...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#C9A45C]/20">
            <FlowerAccent variant="rose" size={48} color="#C9A45C" opacity={0.3} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2">No entries in this view</h3>
            <p className="text-sm text-[#9C8490] font-sans mb-6">
              Write a new page in your shared or private diary to capture your thoughts.
            </p>
            <Button variant="gold" onClick={openCreateModal}>
              Write Entry ✍️
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                whileHover={{ y: -4 }}
                className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:border-[#C9A45C]/40 bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/90"
                onClick={() => setSelectedEntry(entry)}
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{entry.mood || '💖'}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        entry.visibility === 'PRIVATE'
                          ? 'bg-[#C9A45C]/15 border-[#C9A45C]/30 text-[#C9A45C]'
                          : 'bg-[#E98DA3]/15 border-[#E98DA3]/30 text-[#E98DA3]'
                      }`}
                    >
                      {entry.visibility === 'PRIVATE' ? <Lock size={10} /> : <Heart size={10} />}
                      {entry.visibility}
                    </span>
                    {user && entry.author_id === user.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => openEditModal(entry, e)}
                          className="text-[#9C8490] hover:text-[#C9A45C] p-1 transition-colors"
                          aria-label="Edit entry"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(entry.id, e)}
                          className="text-[#9C8490] hover:text-red-400 p-1 transition-colors"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Entry Title & Content */}
                <div className="mb-6 flex-1">
                  <h3
                    className="text-2xl font-serif text-[#FFFCF9] mb-2 group-hover:text-[#C9A45C] transition-colors"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {entry.title}
                  </h3>
                  <p className="text-xs text-[#9C8490] line-clamp-4 leading-relaxed font-sans font-light">
                    {entry.content}
                  </p>
                </div>

                {/* Footer Date */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#9C8490]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(entry.entry_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-[#C9A45C]/80 font-sans flex items-center gap-1 group-hover:underline">
                    Read entry <Eye size={12} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT ENTRY MODAL */}
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
                  {editingEntry ? 'Edit Diary Entry' : 'Write Notebook Entry'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="diary-entry-title"
                  label="Title"
                  placeholder="e.g., A special moment today..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-widest text-[#C9A45C] mb-1.5">
                      Entry Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-xs focus:outline-none focus:border-[#C9A45C] font-sans"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans uppercase tracking-widest text-[#C9A45C] mb-1.5">
                      Mood
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {MOODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMood(m)}
                          className={`text-xl p-1.5 rounded-lg border transition-all cursor-pointer ${
                            mood === m
                              ? 'bg-[#C9A45C]/20 border-[#C9A45C] scale-110'
                              : 'border-transparent hover:bg-white/5 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Privacy Visibility Switcher */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Visibility (Database RLS Enforced)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibility('SHARED')}
                      className={`p-3 rounded-xl border text-xs font-sans flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        visibility === 'SHARED'
                          ? 'bg-[#E98DA3]/20 border-[#E98DA3] text-[#FFFCF9]'
                          : 'bg-white/5 border-white/10 text-[#9C8490]'
                      }`}
                    >
                      <Heart size={14} className="text-[#E98DA3]" />
                      <span>SHARED ❤️</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility('PRIVATE')}
                      className={`p-3 rounded-xl border text-xs font-sans flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        visibility === 'PRIVATE'
                          ? 'bg-[#C9A45C]/20 border-[#C9A45C] text-[#FFFCF9]'
                          : 'bg-white/5 border-white/10 text-[#9C8490]'
                      }`}
                    >
                      <Lock size={14} className="text-[#C9A45C]" />
                      <span>PRIVATE 🔐</span>
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Entry Content
                  </label>
                  <textarea
                    rows={6}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-4 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#C9A45C] placeholder-[#9C8490]/50 font-sans leading-relaxed"
                    placeholder="Write from the heart..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gold" type="submit" isLoading={isSubmitting}>
                    {editingEntry ? 'Update Entry 💖' : 'Save Entry 📖'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL VIEW MODAL */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl p-8 rounded-3xl border border-[#C9A45C]/30 bg-[#241B20]/95 max-h-[85vh] overflow-y-auto relative"
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                {user && selectedEntry.author_id === user.id && (
                  <button
                    onClick={() => {
                      const toEdit = selectedEntry;
                      setSelectedEntry(null);
                      openEditModal(toEdit);
                    }}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-[#C9A45C]/20 hover:text-[#C9A45C] transition-colors"
                    title="Edit Entry"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{selectedEntry.mood}</span>
                <div>
                  <span
                    className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                      selectedEntry.visibility === 'PRIVATE'
                        ? 'bg-[#C9A45C]/15 border-[#C9A45C]/30 text-[#C9A45C]'
                        : 'bg-[#E98DA3]/15 border-[#E98DA3]/30 text-[#E98DA3]'
                    }`}
                  >
                    {selectedEntry.visibility === 'PRIVATE' ? <Lock size={10} /> : <Heart size={10} />}
                    {selectedEntry.visibility} ENTRY
                  </span>
                  <p className="text-xs text-[#9C8490] font-sans mt-1">
                    {new Date(selectedEntry.entry_date).toLocaleDateString(undefined, {
                      dateStyle: 'full',
                    })}
                  </p>
                </div>
              </div>

              <h2
                className="text-3xl font-serif text-[#FFFCF9] mb-6"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {selectedEntry.title}
              </h2>

              <div className="p-6 rounded-2xl bg-[#1A1015]/80 border border-white/5 text-[#FFF8F2] font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {selectedEntry.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
