import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  X,
  Image as ImageIcon,
  Bot,
  MapPin,
  Tag,
  Lock,
  Edit3,
  Trash2,
  MoreVertical,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { fetchMemories, createMemory, updateMemory, deleteMemory } from '@/services/memoriesService';
import { uploadMemoryPhoto, validatePhotoFile } from '@/services/storage';
import { generateAIContent } from '@/services/aiService';
import { HumanApprovalModal } from '@/components/ui/HumanApprovalModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import type { Memory } from '@/types';

export function Memories() {
  const { user, couple } = useAuthStore();
  const { showToast } = useToastStore();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active contextual menu on card
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Create / Edit Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{ storagePath: string; signedUrl?: string; caption?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // AI Caption state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiDraft, setAIDraft] = useState<{ content: string; agent: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const coupleId = couple?.id || 'demo-couple';

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchMemories(coupleId);
      setMemories(data);
      setIsLoading(false);
    }
    loadData();
  }, [coupleId]);

  const [selectedFilter, setSelectedFilter] = useState('all');

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

  // Filtered memories list
  const filteredMemories = useMemo(() => {
    if (selectedFilter === 'all') return memories;
    return groupedMemories[selectedFilter] || [];
  }, [memories, selectedFilter, groupedMemories]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      const validation = validatePhotoFile(file);
      if (!validation.valid) {
        showToast(validation.error || 'Invalid photo file', 'error');
        return;
      }
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMemoryDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setTagsInput('');
    setSelectedFiles([]);
    setFilePreviews([]);
    setExistingPhotos([]);
    setIsUploading(false);
    setUploadProgress(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (mem: Memory) => {
    setTitle(mem.title);
    setDescription(mem.description || '');
    setMemoryDate(mem.memory_date);
    setLocation(mem.location || '');
    setTagsInput(mem.tags ? mem.tags.join(', ') : '');
    setSelectedFiles([]);
    setFilePreviews([]);
    setExistingPhotos(
      mem.photos
        ? mem.photos.map((p) => ({
            storagePath: p.storage_path,
            signedUrl: p.signed_url,
            caption: p.caption || undefined,
          }))
        : []
    );
    setEditingMemory(mem);
    setActiveMenuId(null);
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsUploading(true);
    setUploadProgress('Uploading photos securely...');
    const tempMemoryId = crypto.randomUUID();

    try {
      // 1. Upload photos to private storage
      const uploadedPhotos: { storagePath: string; caption?: string }[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${selectedFiles.length}...`);
        const file = selectedFiles[i];
        const result = await uploadMemoryPhoto(coupleId, tempMemoryId, file);
        if (result) {
          uploadedPhotos.push({ storagePath: result.path });
        }
      }

      setUploadProgress('Saving memory...');
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const newMem = await createMemory({
        coupleId,
        userId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        memoryDate,
        location: location.trim() || undefined,
        tags,
        photos: uploadedPhotos,
      });

      if (newMem) {
        setMemories((prev) => [newMem, ...prev]);
        showToast('Memory saved to your sanctuary ❤️', 'success');
      }

      resetForm();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to create memory', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleUpdateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory || !title.trim()) return;

    setIsUploading(true);
    setUploadProgress('Saving changes...');

    try {
      const memoryId = editingMemory.id;
      const uploadedPhotos: { storagePath: string; caption?: string }[] = [
        ...existingPhotos.map((p) => ({ storagePath: p.storagePath, caption: p.caption })),
      ];

      // Upload newly added files
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Uploading new photo ${i + 1} of ${selectedFiles.length}...`);
        const file = selectedFiles[i];
        const result = await uploadMemoryPhoto(coupleId, memoryId, file);
        if (result) {
          uploadedPhotos.push({ storagePath: result.path });
        }
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const updated = await updateMemory(
        memoryId,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          memoryDate,
          location: location.trim() || undefined,
          tags,
          photos: uploadedPhotos,
        },
        coupleId
      );

      if (updated) {
        setMemories((prev) => prev.map((m) => (m.id === memoryId ? updated : m)));
        if (selectedMemory?.id === memoryId) setSelectedMemory(updated);
        showToast('Memory updated ✨', 'success');
      }

      resetForm();
      setEditingMemory(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update memory', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!memoryToDelete) return;
    setIsDeleting(true);

    try {
      const photoPaths = (memoryToDelete.photos || []).map((p) => p.storage_path);
      const ok = await deleteMemory(memoryToDelete.id, photoPaths);

      if (ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryToDelete.id));
        if (selectedMemory?.id === memoryToDelete.id) {
          setSelectedMemory(null);
        }
        showToast('Memory removed ❤️', 'success');
      } else {
        showToast('Could not delete memory', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting memory', 'error');
    } finally {
      setIsDeleting(false);
      setMemoryToDelete(null);
    }
  };

  return (
    <PageContainer>
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-[#5A2435]/25 blur-3xl" />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
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
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-[#B83B5E]/30"
        >
          <Plus size={18} />
          <span>New Memory</span>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 relative z-10 no-scrollbar">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
            selectedFilter === 'all'
              ? 'bg-[#B83B5E] text-[#FFFCF9] shadow-md shadow-[#B83B5E]/30 font-medium'
              : 'glass-card text-[#9C8490] hover:text-[#FFFCF9] hover:bg-white/5 border border-white/5'
          }`}
        >
          All Moments ({memories.length})
        </button>
        {Object.keys(groupedMemories).map((monthYear) => (
          <button
            key={monthYear}
            onClick={() => setSelectedFilter(monthYear)}
            className={`px-4 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === monthYear
                ? 'bg-[#B83B5E] text-[#FFFCF9] shadow-md shadow-[#B83B5E]/30 font-medium'
                : 'glass-card text-[#9C8490] hover:text-[#FFFCF9] hover:bg-white/5 border border-white/5'
            }`}
          >
            {monthYear} ({groupedMemories[monthYear].length})
          </button>
        ))}
      </div>

      {/* Gallery Section */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading precious memories...
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="glass-card p-10 text-center max-w-lg mx-auto my-8 border border-[#F4B8C9]/20 rounded-3xl shadow-xl bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <FlowerAccent variant="sakura" size={48} color="#F4B8C9" opacity={0.6} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Your story is waiting for its first memory. ❤️
            </h3>
            <p className="text-xs sm:text-sm text-[#9C8490] font-sans mb-6">
              Create your first shared memory with personal photos to build your timeless relationship timeline.
            </p>
            <Button variant="primary" onClick={openCreateModal}>
              + Add First Memory ✨
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((mem) => {
              const firstPhoto = mem.photos?.[0]?.signed_url;
              const isMenuActive = activeMenuId === mem.id;

              return (
                <motion.div
                  key={mem.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="glass-card rounded-2xl overflow-hidden border border-[#F4B8C9]/20 cursor-pointer group flex flex-col justify-between shadow-lg bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/95 relative"
                  onClick={() => setSelectedMemory(mem)}
                >
                  {/* Cover Image / Placeholder */}
                  <div className="h-52 bg-[#1A1015] relative overflow-hidden flex items-center justify-center">
                    {firstPhoto ? (
                      <img
                        src={firstPhoto}
                        alt={mem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[#9C8490]/40">
                        <ImageIcon size={40} />
                        <span className="text-xs font-sans">No Photo Attached</span>
                      </div>
                    )}

                    {/* Top badging & 3-dot menu */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-[#E8C97A] flex items-center gap-1 border border-[#E8C97A]/20">
                      <Lock size={10} />
                      <span>Private Storage</span>
                    </div>

                    <div className="absolute top-3 right-3 relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuActive ? null : mem.id);
                        }}
                        className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-[#9C8490] hover:text-white transition-colors cursor-pointer border border-white/10"
                        aria-label="Memory options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuActive && (
                        <div
                          className="absolute right-0 top-9 w-32 glass-card p-1.5 rounded-xl border border-white/10 bg-[#241B20]/95 shadow-2xl z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openEditModal(mem)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#FFFCF9] hover:bg-white/10 transition-colors text-left"
                          >
                            <Edit3 size={13} className="text-[#F4B8C9]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setMemoryToDelete(mem);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/15 transition-colors text-left"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs text-[#FFFCF9] font-sans">
                      {new Date(mem.memory_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="text-xl font-serif text-[#FFFCF9] group-hover:text-[#F4B8C9] transition-colors mb-2"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {mem.title}
                      </h3>
                      {mem.description && (
                        <p className="text-xs sm:text-sm text-[#9C8490] line-clamp-2 leading-relaxed font-sans mb-3">
                          {mem.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[11px] text-[#9C8490]">
                      {mem.location ? (
                        <span className="flex items-center gap-1 text-[#F4B8C9]/80">
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
        )}
      </div>

      {/* CREATE MEMORY MODAL */}
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
                  Capture New Memory
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isUploading}
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                      Story / Description
                    </label>
                    <button
                      type="button"
                      disabled={isAILoading || !title.trim()}
                      onClick={async () => {
                        if (!title.trim()) return;
                        setIsAILoading(true);
                        const result = await generateAIContent({
                          intent: 'memory_caption',
                          context: { title, location },
                        });
                        setAIDraft({ content: result.draft_content, agent: result.agent_name });
                        setIsAILoading(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E8C97A]/15 border border-[#E8C97A]/30 text-[#E8C97A] text-xs font-sans hover:bg-[#E8C97A]/25 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Bot size={13} />
                      {isAILoading ? 'Generating...' : 'AI Caption ✨'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/20 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9] placeholder-[#9C8490]/50"
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
                  <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A] flex items-center justify-between">
                    <span>Attach Photos (Private Storage)</span>
                    <span className="text-[10px] text-[#9C8490] lowercase">🔒 encrypted / signed access</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    multiple
                    className="hidden"
                  />

                  <div className="grid grid-cols-4 gap-3">
                    {filePreviews.map((preview, i) => (
                      <div key={i} className="relative h-20 rounded-xl overflow-hidden border border-[#F4B8C9]/30 group">
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 rounded-xl border border-dashed border-[#F4B8C9]/40 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-[#F4B8C9] gap-1 transition-colors cursor-pointer"
                    >
                      <Upload size={18} />
                      <span className="text-[10px] font-sans">Upload Photo</span>
                    </button>
                  </div>
                </div>

                {uploadProgress && (
                  <p className="text-xs text-[#F4B8C9] font-sans animate-pulse pt-2">
                    {uploadProgress}
                  </p>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isUploading}>
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

      {/* EDIT MEMORY MODAL */}
      <AnimatePresence>
        {editingMemory && (
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
                  Edit Memory
                </h2>
                <button
                  onClick={() => setEditingMemory(null)}
                  disabled={isUploading}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateMemory} className="space-y-4">
                <Input
                  id="edit-memory-title"
                  label="Memory Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="edit-memory-date"
                    type="date"
                    label="Date"
                    value={memoryDate}
                    onChange={(e) => setMemoryDate(e.target.value)}
                    required
                  />
                  <Input
                    id="edit-memory-location"
                    label="Location (Optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                    Story / Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/20 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9] placeholder-[#9C8490]/50"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Input
                  id="edit-memory-tags"
                  label="Tags (Comma separated)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />

                {/* Photos & Replacement */}
                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                    Photos
                  </label>

                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    multiple
                    className="hidden"
                  />

                  <div className="grid grid-cols-4 gap-3">
                    {existingPhotos.map((photo, i) => (
                      <div key={`existing-${i}`} className="relative h-20 rounded-xl overflow-hidden border border-white/10 group">
                        <img src={photo.signedUrl} alt="existing" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {filePreviews.map((preview, i) => (
                      <div key={`new-${i}`} className="relative h-20 rounded-xl overflow-hidden border border-[#F4B8C9]/30 group">
                        <img src={preview} alt="new-preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="h-20 rounded-xl border border-dashed border-[#F4B8C9]/40 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-[#F4B8C9] gap-1 transition-colors cursor-pointer"
                    >
                      <Plus size={18} />
                      <span className="text-[10px] font-sans">Add Photo</span>
                    </button>
                  </div>
                </div>

                {uploadProgress && (
                  <p className="text-xs text-[#F4B8C9] font-sans animate-pulse pt-2">
                    {uploadProgress}
                  </p>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <Button variant="ghost" type="button" onClick={() => setEditingMemory(null)} disabled={isUploading}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isUploading}>
                    Save Changes ✨
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CINEMATIC MEMORY DETAIL VIEWER LIGHTBOX */}
      <AnimatePresence>
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-3xl p-6 sm:p-10 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto relative"
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedMemory);
                    setSelectedMemory(null);
                  }}
                  className="p-2 rounded-full bg-white/10 text-[#F4B8C9] hover:bg-white/20 transition-colors"
                  aria-label="Edit memory"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemoryToDelete(selectedMemory);
                  }}
                  className="p-2 rounded-full bg-white/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  aria-label="Delete memory"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 pr-24">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#F4B8C9]/15 text-[#F4B8C9] text-xs font-sans flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(selectedMemory.memory_date).toLocaleDateString(undefined, {
                      dateStyle: 'full',
                    })}
                  </span>
                  {selectedMemory.location && (
                    <span className="px-3 py-1 rounded-full bg-[#E8C97A]/15 text-[#E8C97A] text-xs font-sans flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedMemory.location}
                    </span>
                  )}
                </div>

                <h2
                  className="text-3xl sm:text-4xl font-serif text-[#FFFCF9] mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {selectedMemory.title}
                </h2>

                {selectedMemory.description && (
                  <p className="text-base text-[#F4B8C9]/90 font-sans leading-relaxed mb-6 italic">
                    "{selectedMemory.description}"
                  </p>
                )}
              </div>

              {/* Photos Gallery Viewer */}
              {selectedMemory.photos && selectedMemory.photos.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="rounded-2xl overflow-hidden border border-[#F4B8C9]/20 max-h-96 bg-black flex items-center justify-center">
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
                  <Tag size={14} className="text-[#E8C97A]" />
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

      {/* Human Approval Modal for AI captions */}
      <HumanApprovalModal
        isOpen={!!aiDraft}
        agentName={aiDraft?.agent ?? ''}
        intent="memory_caption"
        draftContent={aiDraft?.content ?? ''}
        onApprove={(approved) => {
          setDescription(approved);
          setAIDraft(null);
        }}
        onReject={() => setAIDraft(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!memoryToDelete}
        title="Delete this memory?"
        message="This memory and its attached photo will be permanently removed from your sanctuary."
        confirmText="Delete Memory"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMemoryToDelete(null)}
      />
    </PageContainer>
  );
}
