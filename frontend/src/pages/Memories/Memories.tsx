import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Calendar, Tag, X, Image as ImageIcon, Sparkles, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchMemories, createMemory } from '@/services/memoriesService';
import { uploadMemoryPhoto } from '@/services/storage';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Memory } from '@/types';

export function Memories() {
  const { user, couple } = useAuthStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const coupleId = couple?.id || 'demo-couple';
      const data = await fetchMemories(coupleId);
      setMemories(data);
      setIsLoading(false);
    }
    loadData();
  }, [couple?.id]);

  // Group memories by Year and Month
  const groupedMemories = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    memories.forEach((mem) => {
      const date = new Date(mem.memory_date);
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(mem);
    });
    return groups;
  }, [memories]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsUploading(true);
    const coupleId = couple?.id || 'demo-couple';
    const tempMemoryId = crypto.randomUUID();

    // 1. Upload photos to private bucket
    const uploadedPhotos: { storagePath: string; caption?: string }[] = [];
    for (const file of selectedFiles) {
      const result = await uploadMemoryPhoto(coupleId, tempMemoryId, file);
      if (result) {
        uploadedPhotos.push({ storagePath: result.signedUrl || result.path });
      }
    }

    // 2. Save memory row
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newMem = await createMemory({
      coupleId,
      userId: user.id,
      title,
      description,
      memoryDate,
      location,
      tags,
      photos: uploadedPhotos,
    });

    if (newMem) {
      setMemories((prev) => [newMem, ...prev]);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setLocation('');
    setTagsInput('');
    setSelectedFiles([]);
    setFilePreviews([]);
    setIsUploading(false);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col">
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-[#5A2435]/25 blur-3xl" />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="text-[#C9A45C]" />
            OUR WORLD • MEMORIES
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Memory Gallery & Timeline
          </h1>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Memory</span>
        </Button>
      </div>

      {/* Timeline Section */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading precious memories...
          </div>
        ) : Object.keys(groupedMemories).length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#E98DA3]/20">
            <FlowerAccent variant="rose" size={48} color="#E98DA3" opacity={0.3} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2">No memories yet</h3>
            <p className="text-sm text-[#9C8490] font-sans mb-6">
              Create your first shared memory to start building your visual timeline together.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Add First Memory ✨
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedMemories).map(([monthYear, items]) => (
              <div key={monthYear} className="relative">
                {/* Month/Year Badge */}
                <div className="sticky top-4 z-20 mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-[#C9A45C]/30 bg-[#241B20]/90 backdrop-blur-md">
                  <Calendar size={14} className="text-[#C9A45C]" />
                  <span
                    className="text-sm font-serif tracking-widest text-[#FFFCF9]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {monthYear}
                  </span>
                </div>

                {/* Grid of memory cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((mem) => {
                    const firstPhoto = mem.photos?.[0]?.signed_url;
                    return (
                      <motion.div
                        key={mem.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="glass-card rounded-2xl overflow-hidden border border-[#E98DA3]/15 cursor-pointer group flex flex-col justify-between"
                        onClick={() => setSelectedMemory(mem)}
                      >
                        {/* Cover Image / Placeholder */}
                        <div className="h-48 bg-[#1A1015] relative overflow-hidden flex items-center justify-center">
                          {firstPhoto ? (
                            <img
                              src={firstPhoto}
                              alt={mem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-[#9C8490]/40">
                              <ImageIcon size={36} />
                              <span className="text-xs font-sans">No Photo Attached</span>
                            </div>
                          )}

                          {/* Private badge indicator */}
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-[#C9A45C] flex items-center gap-1">
                            <Lock size={10} />
                            <span>Private Storage</span>
                          </div>

                          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs text-[#FFFCF9] font-sans">
                            {new Date(mem.memory_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-serif text-[#FFFCF9] group-hover:text-[#E98DA3] transition-colors mb-2">
                              {mem.title}
                            </h3>
                            {mem.description && (
                              <p className="text-xs text-[#9C8490] line-clamp-2 leading-relaxed font-sans mb-3">
                                {mem.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-[#9C8490]">
                            {mem.location ? (
                              <span className="flex items-center gap-1 text-[#E98DA3]/80">
                                <MapPin size={12} />
                                {mem.location}
                              </span>
                            ) : (
                              <span />
                            )}
                            {mem.tags && mem.tags.length > 0 && (
                              <div className="flex gap-1">
                                {mem.tags.slice(0, 2).map((t) => (
                                  <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px]">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MEMORY MODAL */}
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
                  Capture New Memory
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4">
                <Input
                  id="memory-title"
                  label="Memory Title"
                  placeholder="e.g. Sunset by the Beach"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="memory-date"
                    type="date"
                    label="Date"
                    value={memoryDate}
                    onChange={(e) => setMemoryDate(e.target.value)}
                    required
                  />
                  <Input
                    id="memory-location"
                    label="Location (Optional)"
                    placeholder="e.g. Marine Drive"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Story / Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-[#E98DA3]/20 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#B83B5E] placeholder-[#9C8490]/50"
                    placeholder="Write a few lines about this special moment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Input
                  id="memory-tags"
                  label="Tags (Comma separated)"
                  placeholder="romantic, trip, anniversary"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />

                {/* Photo Upload Area */}
                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C] flex items-center justify-between">
                    <span>Photos (Private Storage)</span>
                    <span className="text-[10px] text-[#9C8490] lowercase">🔒 encrypted / signed access</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  <div className="grid grid-cols-4 gap-3">
                    {filePreviews.map((preview, i) => (
                      <div key={i} className="relative h-20 rounded-xl overflow-hidden border border-white/10 group">
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 rounded-xl border border-dashed border-[#E98DA3]/40 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-[#E98DA3] gap-1 transition-colors cursor-pointer"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-sans">Add Photo</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isUploading}>
                    Save Memory ✨
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CINEMATIC MEMORY DETAIL VIEWER */}
      <AnimatePresence>
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-3xl p-6 sm:p-10 rounded-3xl border border-[#E98DA3]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setSelectedMemory(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#E98DA3]/20 text-[#E98DA3] text-xs font-sans flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(selectedMemory.memory_date).toLocaleDateString(undefined, {
                      dateStyle: 'full',
                    })}
                  </span>
                  {selectedMemory.location && (
                    <span className="px-3 py-1 rounded-full bg-[#C9A45C]/20 text-[#C9A45C] text-xs font-sans flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedMemory.location}
                    </span>
                  )}
                </div>

                <h2
                  className="text-4xl font-serif text-[#FFFCF9] mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {selectedMemory.title}
                </h2>

                {selectedMemory.description && (
                  <p className="text-base text-[#E98DA3]/90 font-sans leading-relaxed mb-6 italic">
                    "{selectedMemory.description}"
                  </p>
                )}
              </div>

              {/* Photos Gallery Viewer */}
              {selectedMemory.photos && selectedMemory.photos.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="rounded-2xl overflow-hidden border border-[#E98DA3]/20 max-h-96 bg-black flex items-center justify-center">
                    <img
                      src={selectedMemory.photos[0].signed_url}
                      alt={selectedMemory.title}
                      className="max-h-96 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <Tag size={14} className="text-[#C9A45C]" />
                  <div className="flex flex-wrap gap-2">
                    {selectedMemory.tags.map((t) => (
                      <span key={t} className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#9C8490]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
