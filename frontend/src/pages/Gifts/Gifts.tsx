import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, CheckCircle2, Circle, ExternalLink, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchGifts, addGift, toggleGiftGivenStatus } from '@/services/giftsService';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { GiftItem } from '@/types';

export function Gifts() {
  const { user, couple } = useAuthStore();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'WISHLIST' | 'GIVEN'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceEstimate, setPriceEstimate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const coupleId = couple?.id || 'demo-couple';
      const data = await fetchGifts(coupleId);
      setGifts(data);
      setIsLoading(false);
    }
    loadData();
  }, [couple?.id]);

  const filteredGifts = useMemo(() => {
    return gifts.filter((g) => {
      if (filter === 'WISHLIST') return !g.is_given;
      if (filter === 'GIVEN') return g.is_given;
      return true;
    });
  }, [gifts, filter]);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    const coupleId = couple?.id || 'demo-couple';

    const newGift = await addGift({
      coupleId,
      addedById: user.id,
      title,
      description,
      priceEstimate,
      linkUrl,
    });

    if (newGift) {
      setGifts((prev) => [newGift, ...prev]);
    }

    setTitle('');
    setDescription('');
    setPriceEstimate('');
    setLinkUrl('');
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (id: string, currentGiven: boolean) => {
    const nextState = !currentGiven;
    setGifts((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_given: nextState, given_at: nextState ? new Date().toISOString() : null } : g))
    );
    await toggleGiftGivenStatus(id, nextState);
  };

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#C9A45C]/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#B83B5E]/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1">
            <Gift size={14} className="text-[#C9A45C]" />
            OUR WORLD • GIFTS & WISHLIST
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Gift Shop & Surprise Wishlist
          </h1>
        </div>

        <Button
          variant="gold"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Wish</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="relative z-10 mb-8 flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 w-fit">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors ${
            filter === 'ALL' ? 'bg-[#C9A45C]/20 text-[#FFFCF9] border border-[#C9A45C]/30' : 'text-[#9C8490]'
          }`}
        >
          All Items ({gifts.length})
        </button>
        <button
          onClick={() => setFilter('WISHLIST')}
          className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors ${
            filter === 'WISHLIST' ? 'bg-[#C9A45C]/20 text-[#FFFCF9] border border-[#C9A45C]/30' : 'text-[#9C8490]'
          }`}
        >
          Wishlist ({gifts.filter((g) => !g.is_given).length})
        </button>
        <button
          onClick={() => setFilter('GIVEN')}
          className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors ${
            filter === 'GIVEN' ? 'bg-[#E98DA3]/20 text-[#E98DA3] border border-[#E98DA3]/30' : 'text-[#9C8490]'
          }`}
        >
          Gifted 🎁 ({gifts.filter((g) => g.is_given).length})
        </button>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Opening gift catalog...
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#C9A45C]/20">
            <FlowerAccent variant="rose" size={48} color="#C9A45C" opacity={0.3} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2">No gifts in this view</h3>
            <p className="text-sm text-[#9C8490] font-sans mb-6">
              Add a surprise idea or gift wishlist item for special occasions.
            </p>
            <Button variant="gold" onClick={() => setIsModalOpen(true)}>
              Add Wish 🎁
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => (
              <motion.div
                key={gift.id}
                whileHover={{ y: -4 }}
                className={`glass-card p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between transition-all ${
                  gift.is_given
                    ? 'border-[#E98DA3]/30 bg-[#241B20]/60 opacity-85'
                    : 'border-[#C9A45C]/30 bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/90 hover:border-[#C9A45C]'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(gift.id, gift.is_given)}
                      className="text-[#C9A45C] hover:scale-110 transition-transform cursor-pointer"
                      title={gift.is_given ? 'Mark as pending wishlist' : 'Mark as given'}
                    >
                      {gift.is_given ? (
                        <CheckCircle2 size={24} className="text-[#E98DA3] fill-[#E98DA3]/20" />
                      ) : (
                        <Circle size={24} className="text-[#C9A45C]" />
                      )}
                    </button>
                    {gift.price_estimate && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#C9A45C] font-sans">
                        {gift.price_estimate}
                      </span>
                    )}
                  </div>

                  {gift.link_url && (
                    <a
                      href={gift.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#C9A45C] hover:bg-white/15 transition-colors"
                      title="View Gift Link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                <div className="mb-6">
                  <h3
                    className={`text-2xl font-serif mb-2 ${
                      gift.is_given ? 'line-through text-[#9C8490]' : 'text-[#FFFCF9]'
                    }`}
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {gift.title}
                  </h3>
                  {gift.description && (
                    <p className="text-xs text-[#9C8490] font-sans leading-relaxed">
                      {gift.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#9C8490]">
                  <span>{gift.is_given ? '🎁 Gifted & Received' : '🌟 Wishlist Item'}</span>
                  <span>{new Date(gift.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ADD GIFT MODAL */}
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
                  Add Gift Wish
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddGift} className="space-y-4">
                <Input
                  id="gift-title"
                  label="Gift Title"
                  placeholder="e.g. Instant Camera, Book, Perfume"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <Input
                  id="gift-price"
                  label="Price Estimate (Optional)"
                  placeholder="e.g. $50"
                  value={priceEstimate}
                  onChange={(e) => setPriceEstimate(e.target.value)}
                />

                <Input
                  id="gift-link"
                  label="Product Link URL (Optional)"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Description / Size / Color Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#C9A45C] placeholder-[#9C8490]/50"
                    placeholder="Specific color preference, size, or details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gold" type="submit" isLoading={isSubmitting}>
                    Add Wish 🎁
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
