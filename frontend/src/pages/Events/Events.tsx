import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Clock, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchEvents, createEvent } from '@/services/eventsService';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CoupleEvent, EventCategory } from '@/types';

const CATEGORIES: { key: EventCategory; label: string; emoji: string }[] = [
  { key: 'anniversary', label: 'Anniversary', emoji: '💖' },
  { key: 'date_night', label: 'Date Night', emoji: '🍷' },
  { key: 'trip', label: 'Trip / Getaway', emoji: '✈️' },
  { key: 'milestone', label: 'Milestone', emoji: '🌟' },
  { key: 'other', label: 'Special Occasion', emoji: '🎉' },
];

export function Events() {
  const { user, couple } = useAuthStore();
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<EventCategory>('date_night');
  const [isAnnual, setIsAnnual] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const coupleId = couple?.id || 'demo-couple';
      const data = await fetchEvents(coupleId);
      setEvents(data);
      setIsLoading(false);
    }
    loadData();
  }, [couple?.id]);

  // Compute countdowns & sort events by date
  const sortedEvents = useMemo(() => {
    return [...events].map((evt) => {
      const today = new Date();
      const target = new Date(evt.event_date);
      const diffTime = target.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...evt, daysLeft };
    }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [events]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    const coupleId = couple?.id || 'demo-couple';

    const newEvt = await createEvent({
      coupleId,
      userId: user.id,
      title,
      description,
      eventDate,
      category,
      isAnnual,
    });

    if (newEvt) {
      setEvents((prev) => [...prev, newEvt]);
    }

    setTitle('');
    setDescription('');
    setCategory('date_night');
    setIsAnnual(false);
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col">
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#C9A45C]/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1">
            <CalendarIcon size={14} className="text-[#C9A45C]" />
            OUR WORLD • EVENTS & COUNTDOWNS
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Shared Calendar & Countdown Timers
          </h1>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Event</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading upcoming countdowns...
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#E98DA3]/20">
            <FlowerAccent variant="rose" size={48} color="#E98DA3" opacity={0.3} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2">No upcoming events</h3>
            <p className="text-sm text-[#9C8490] font-sans mb-6">
              Create a date night, anniversary countdown, or trip to start counting down the days together.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Add First Event ✨
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((evt) => {
              const catObj = CATEGORIES.find((c) => c.key === evt.category) || CATEGORIES[4];
              const isPast = evt.daysLeft < 0;

              return (
                <motion.div
                  key={evt.id}
                  whileHover={{ y: -4 }}
                  className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between hover:border-[#E98DA3]/40 bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/90"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{catObj.emoji}</span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#E98DA3] font-sans">
                      {catObj.label}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3
                      className="text-2xl font-serif text-[#FFFCF9] mb-1"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {evt.title}
                    </h3>
                    {evt.description && (
                      <p className="text-xs text-[#9C8490] font-sans leading-relaxed mb-3">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  {/* Countdown Big Display */}
                  <div className="p-4 rounded-xl bg-black/40 border border-[#C9A45C]/30 text-center mb-4">
                    <p className="text-xs text-[#C9A45C] font-sans uppercase tracking-widest mb-1">
                      {isPast ? 'Days Ago' : 'Countdown'}
                    </p>
                    <p
                      className="text-4xl font-serif text-[#FFFCF9]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {isPast ? Math.abs(evt.daysLeft) : evt.daysLeft} <span className="text-lg text-[#E98DA3]">Days</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#9C8490] pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(evt.event_date).toLocaleDateString(undefined, {
                        dateStyle: 'full',
                      })}
                    </span>
                    {evt.is_annual && <span className="text-[#C9A45C]">Annual</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#E98DA3]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <Sparkles size={20} className="text-[#C9A45C]" />
                  Schedule New Event
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <Input
                  id="event-title"
                  label="Event Title"
                  placeholder="e.g. Weekend Beach Getaway"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="event-date"
                    type="date"
                    label="Event Date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EventCategory)}
                      className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#E98DA3]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key} className="bg-[#241B20]">
                          {c.emoji} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#E98DA3] placeholder-[#9C8490]/50"
                    placeholder="Location, reservations, or special plans..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="annual-cb"
                    checked={isAnnual}
                    onChange={(e) => setIsAnnual(e.target.checked)}
                    className="accent-[#B83B5E]"
                  />
                  <label htmlFor="annual-cb" className="text-xs font-sans text-[#FFFCF9]">
                    Repeat annually (e.g. Anniversary / Birthday)
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Create Event ✨
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
