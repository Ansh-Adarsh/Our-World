import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  Calendar as CalendarIcon,
  X,
  Edit3,
  Trash2,
  MoreVertical,
  Repeat,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '@/services/eventsService';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
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
  const { showToast } = useToastStore();

  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CoupleEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CoupleEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CoupleEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active contextual menu on card
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<EventCategory>('date_night');
  const [isAnnual, setIsAnnual] = useState(false);

  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');

  const coupleId = couple?.id || 'demo-couple';

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchEvents(coupleId);
      setEvents(data);
      setIsLoading(false);
    }
    loadData();
  }, [coupleId]);

  // Compute countdowns & sort events by date
  const processedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.map((evt) => {
      const target = new Date(evt.event_date);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...evt, daysLeft };
    }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filterTab === 'upcoming') {
      return processedEvents.filter((e) => e.daysLeft >= 0);
    }
    if (filterTab === 'past') {
      return processedEvents.filter((e) => e.daysLeft < 0);
    }
    return processedEvents;
  }, [processedEvents, filterTab]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setCategory('date_night');
    setIsAnnual(false);
    setIsSubmitting(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (evt: CoupleEvent) => {
    setTitle(evt.title);
    setDescription(evt.description || '');
    setEventDate(evt.event_date);
    setCategory(evt.category);
    setIsAnnual(evt.is_annual);
    setEditingEvent(evt);
    setActiveMenuId(null);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSubmitting(true);

    try {
      const newEvt = await createEvent({
        coupleId,
        userId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate,
        category,
        isAnnual,
      });

      if (newEvt) {
        setEvents((prev) => [...prev, newEvt]);
        showToast('Event created ✨', 'success');
      }

      resetForm();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to create event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !title.trim()) return;

    setIsSubmitting(true);

    try {
      const updated = await updateEvent(
        editingEvent.id,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          eventDate,
          category,
          isAnnual,
        },
        coupleId
      );

      if (updated) {
        setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? updated : e)));
        if (selectedEvent?.id === editingEvent.id) {
          setSelectedEvent(updated);
        }
        showToast('Event updated ✨', 'success');
      }

      resetForm();
      setEditingEvent(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);

    try {
      const ok = await deleteEvent(eventToDelete.id);
      if (ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
        if (selectedEvent?.id === eventToDelete.id) {
          setSelectedEvent(null);
        }
        showToast('Event removed ❤️', 'success');
      } else {
        showToast('Could not delete event', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting event', 'error');
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  return (
    <PageContainer>
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#E8C97A]/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
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
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-[#B83B5E]/30"
        >
          <Plus size={18} />
          <span>New Event</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-4 mb-6 relative z-10">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-[#B83B5E] text-[#FFFCF9] shadow-md shadow-[#B83B5E]/30 font-medium'
              : 'glass-card text-[#9C8490] hover:text-[#FFFCF9] hover:bg-white/5 border border-white/5'
          }`}
        >
          All Events ({processedEvents.length})
        </button>
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`px-4 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'upcoming'
              ? 'bg-[#B83B5E] text-[#FFFCF9] shadow-md shadow-[#B83B5E]/30 font-medium'
              : 'glass-card text-[#9C8490] hover:text-[#FFFCF9] hover:bg-white/5 border border-white/5'
          }`}
        >
          Upcoming ({processedEvents.filter((e) => e.daysLeft >= 0).length})
        </button>
        <button
          onClick={() => setFilterTab('past')}
          className={`px-4 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'past'
              ? 'bg-[#B83B5E] text-[#FFFCF9] shadow-md shadow-[#B83B5E]/30 font-medium'
              : 'glass-card text-[#9C8490] hover:text-[#FFFCF9] hover:bg-white/5 border border-white/5'
          }`}
        >
          Past Milestones ({processedEvents.filter((e) => e.daysLeft < 0).length})
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading upcoming countdowns...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#F4B8C9]/20 rounded-3xl shadow-xl bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <FlowerAccent variant="sakura" size={48} color="#F4B8C9" opacity={0.6} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              No special dates yet.
            </h3>
            <p className="text-xs sm:text-sm text-[#9C8490] font-sans mb-6">
              Create a date night, anniversary countdown, or trip to start counting down the days together.
            </p>
            <Button variant="primary" onClick={openCreateModal}>
              + Add First Event ✨
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const catObj = CATEGORIES.find((c) => c.key === evt.category) || CATEGORIES[4];
              const isPast = evt.daysLeft < 0;
              const isToday = evt.daysLeft === 0;
              const isMenuActive = activeMenuId === evt.id;

              return (
                <motion.div
                  key={evt.id}
                  whileHover={{ y: -4 }}
                  className="glass-card p-6 sm:p-7 rounded-2xl border border-[#F4B8C9]/20 relative overflow-hidden flex flex-col justify-between hover:border-[#F4B8C9]/40 bg-gradient-to-b from-[#2E2028]/85 to-[#241B20]/95 shadow-xl cursor-pointer"
                  onClick={() => setSelectedEvent(evt)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{catObj.emoji}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#F4B8C9] font-sans">
                          {catObj.label}
                        </span>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuActive ? null : evt.id);
                            }}
                            className="p-1.5 rounded-full bg-white/5 text-[#9C8490] hover:text-white transition-colors cursor-pointer border border-white/10"
                            aria-label="Event options"
                          >
                            <MoreVertical size={15} />
                          </button>

                          {isMenuActive && (
                            <div
                              className="absolute right-0 top-8 w-32 glass-card p-1.5 rounded-xl border border-white/10 bg-[#241B20]/95 shadow-2xl z-30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => openEditModal(evt)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#FFFCF9] hover:bg-white/10 transition-colors text-left"
                              >
                                <Edit3 size={13} className="text-[#F4B8C9]" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEventToDelete(evt);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/15 transition-colors text-left"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <h3
                      className="text-2xl font-serif text-[#FFFCF9] mb-1"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {evt.title}
                    </h3>
                    {evt.description && (
                      <p className="text-xs text-[#9C8490] font-sans leading-relaxed mb-4 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div>
                    {/* Countdown Big Display */}
                    <div className="p-4 rounded-xl bg-black/40 border border-[#E8C97A]/25 text-center my-3">
                      <p className="text-[11px] text-[#E8C97A] font-sans uppercase tracking-widest mb-1">
                        {isToday ? 'Today! 🎉' : isPast ? 'Days Ago' : 'Countdown'}
                      </p>
                      <p
                        className="text-4xl font-serif text-[#FFFCF9]"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {isToday ? 'Happening Now' : Math.abs(evt.daysLeft)}{' '}
                        {!isToday && <span className="text-base text-[#F4B8C9]">Days</span>}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#9C8490] pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-[#E8C97A]" />
                        {new Date(evt.event_date).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </span>
                      {evt.is_annual && (
                        <span className="text-[#E8C97A] flex items-center gap-1 text-[10px]">
                          <Repeat size={11} /> Annual
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <FlowerAccent variant="sakura" size={20} color="#F4B8C9" opacity={0.9} />
                  Schedule New Event
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
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
                    <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EventCategory)}
                      className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/25 rounded-xl p-3.5 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9]"
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
                  <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/25 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9] placeholder-[#9C8490]/50"
                    placeholder="Location, reservations, or special plans..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="annual-cb"
                    checked={isAnnual}
                    onChange={(e) => setIsAnnual(e.target.checked)}
                    className="accent-[#B83B5E] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="annual-cb" className="text-xs font-sans text-[#FFFCF9] cursor-pointer">
                    Repeat annually (e.g. Anniversary / Birthday)
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
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

      {/* EDIT EVENT MODAL */}
      <AnimatePresence>
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <Edit3 size={20} className="text-[#F4B8C9]" />
                  Edit Event
                </h2>
                <button
                  onClick={() => setEditingEvent(null)}
                  disabled={isSubmitting}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateEvent} className="space-y-4">
                <Input
                  id="edit-event-title"
                  label="Event Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="edit-event-date"
                    type="date"
                    label="Event Date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EventCategory)}
                      className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/25 rounded-xl p-3.5 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9]"
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
                  <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/25 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9] placeholder-[#9C8490]/50"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="edit-annual-cb"
                    checked={isAnnual}
                    onChange={(e) => setIsAnnual(e.target.checked)}
                    className="accent-[#B83B5E] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="edit-annual-cb" className="text-xs font-sans text-[#FFFCF9] cursor-pointer">
                    Repeat annually (e.g. Anniversary / Birthday)
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <Button variant="ghost" type="button" onClick={() => setEditingEvent(null)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Save Changes ✨
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EVENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-xl p-6 sm:p-10 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto relative"
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  className="p-2 rounded-full bg-white/10 text-[#F4B8C9] hover:bg-white/20 transition-colors"
                  aria-label="Edit event"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEventToDelete(selectedEvent);
                  }}
                  className="p-2 rounded-full bg-white/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 pr-24">
                <span className="px-3 py-1 rounded-full bg-[#F4B8C9]/15 text-[#F4B8C9] text-xs font-sans flex items-center gap-1.5 inline-flex mb-3">
                  <CalendarIcon size={12} />
                  {new Date(selectedEvent.event_date).toLocaleDateString(undefined, {
                    dateStyle: 'full',
                  })}
                </span>

                <h2
                  className="text-3xl sm:text-4xl font-serif text-[#FFFCF9] mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {selectedEvent.title}
                </h2>

                {selectedEvent.description && (
                  <p className="text-sm sm:text-base text-[#F4B8C9]/90 font-sans leading-relaxed mb-6 italic">
                    "{selectedEvent.description}"
                  </p>
                )}
              </div>

              {/* Big Ticker inside Modal */}
              <div className="p-6 rounded-2xl bg-black/40 border border-[#E8C97A]/30 text-center my-6">
                <p className="text-xs text-[#E8C97A] font-sans uppercase tracking-widest mb-1">
                  Countdown
                </p>
                <p
                  className="text-5xl font-serif text-[#FFFCF9]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {(() => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const target = new Date(selectedEvent.event_date);
                    target.setHours(0,0,0,0);
                    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000*60*60*24));
                    return diff === 0 ? 'Today! 🎉' : `${Math.abs(diff)} Days ${diff < 0 ? 'Ago' : 'Left'}`;
                  })()}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        title="Delete this event?"
        message="This event countdown will be permanently removed from your calendar and dashboard ticker."
        confirmText="Delete Event"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEventToDelete(null)}
      />
    </PageContainer>
  );
}
