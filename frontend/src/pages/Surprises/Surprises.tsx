import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Gift,
  Heart,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Send,
  ArrowLeft,
  Calendar,
  Play,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PartnerConnectModal } from '@/components/ui/PartnerConnectModal';
import { SurpriseEditorModal } from '@/components/surprise/SurpriseEditorModal';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import {
  fetchSurprisesForCouple,
  publishSurprise,
  unpublishSurprise,
  deleteSurprise,
} from '@/services/surpriseService';
import type { Surprise } from '@/types';

export function Surprises() {
  const navigate = useNavigate();
  const { user, couple } = useAuthStore();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'created' | 'received'>('created');
  const [surprises, setSurprises] = useState<Surprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSurprise, setEditingSurprise] = useState<Surprise | null>(null);

  // Delete Dialog state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Partner Connect modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const coupleId = couple?.id;
  const currentUserId = user?.id;
  const partnerName = couple?.partner_name || 'Partner';
  const recipientId =
    couple?.partner_1_id === currentUserId
      ? couple?.partner_2_id || 'partner-id'
      : couple?.partner_1_id || 'partner-id';

  const loadSurprises = async () => {
    if (!coupleId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchSurprisesForCouple(coupleId);
      setSurprises(data);
    } catch (err: any) {
      console.error('[Surprises] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSurprises();
  }, [coupleId]);

  const createdSurprises = surprises.filter((s) => s.creator_id === currentUserId);
  const receivedSurprises = surprises.filter(
    (s) => s.creator_id !== currentUserId && s.status === 'published'
  );

  const handleOpenCreate = () => {
    setEditingSurprise(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (surprise: Surprise) => {
    setEditingSurprise(surprise);
    setIsEditorOpen(true);
  };

  const handleTogglePublish = async (surprise: Surprise) => {
    try {
      if (surprise.status === 'published') {
        await unpublishSurprise(surprise.id);
        showToast('Surprise returned to drafts', 'info');
      } else {
        await publishSurprise(surprise.id);
        showToast(`Surprise published for ${partnerName}! 🎁`, 'success');
      }
      await loadSurprises();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteSurprise(deleteTargetId);
      showToast('Surprise deleted safely', 'info');
      setSurprises((prev) => prev.filter((s) => s.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete surprise', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = (surprise: Surprise) => {
    navigate(`/birthday?surpriseId=${surprise.id}&preview=true`);
  };

  const handleOpenExperience = (surprise: Surprise) => {
    navigate(`/birthday?surpriseId=${surprise.id}`);
  };

  return (
    <PageContainer>
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#E8C97A]/10 blur-3xl" />
      </div>

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
            OUR WORLD • ROMANTIC SURPRISE ENGINE
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Sanctuary Surprises
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <Plus size={16} />
            <span>Create Surprise</span>
          </Button>

          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-sans text-[#9C8490] hover:text-[#F4B8C9] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-fit relative z-10">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
            activeTab === 'created'
              ? 'bg-[#B83B5E] text-white shadow-md'
              : 'text-[#9C8490] hover:text-white'
          }`}
        >
          <Heart size={14} />
          <span>Surprises I Created ({createdSurprises.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
            activeTab === 'received'
              ? 'bg-[#B83B5E] text-white shadow-md'
              : 'text-[#9C8490] hover:text-white'
          }`}
        >
          <Gift size={14} />
          <span>Surprises For Me ({receivedSurprises.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="relative z-10">
        {activeTab === 'created' ? (
          <div>
            {isLoading ? (
              <div className="py-16 text-center text-[#9C8490] text-sm">
                Loading your romantic creations...
              </div>
            ) : createdSurprises.length === 0 ? (
              <Card variant="dark" className="p-10 text-center border-dashed border-white/15 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#B83B5E]/15 text-[#F4B8C9] flex items-center justify-center mx-auto mb-4 border border-[#B83B5E]/30">
                  <Gift size={28} />
                </div>
                <h3
                  className="text-2xl font-light text-[#FFFCF9] mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Create Your First Surprise
                </h3>
                <p className="text-xs text-[#9C8490] font-sans max-w-md mx-auto mb-6 leading-relaxed">
                  Design a personalized interactive milestone for {partnerName} with custom questions, playful escape buttons, memories, and your personal letter.
                </p>
                <Button variant="primary" onClick={handleOpenCreate} className="mx-auto flex items-center gap-2 text-xs">
                  <Plus size={16} />
                  <span>Start Crafting Surprise</span>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdSurprises.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full"
                  >
                    <Card
                      variant="dark"
                      className="p-6 h-full flex flex-col justify-between border border-[#F4B8C9]/20 bg-gradient-to-b from-[#2A1D25]/90 to-[#20171D]/95 hover:border-[#F4B8C9]/40 transition-all rounded-3xl"
                    >
                      <div>
                        {/* Top badges */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="px-2.5 py-1 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#E8C97A] text-[10px] font-sans font-semibold uppercase tracking-wider">
                            {s.occasion.replace('_', ' ')}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wider flex items-center gap-1 ${
                              s.status === 'published'
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : 'bg-white/10 border border-white/15 text-[#9C8490]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                s.status === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-[#9C8490]'
                              }`}
                            />
                            {s.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        <h3
                          className="text-xl font-light text-[#FFFCF9] mb-2 line-clamp-2"
                          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        >
                          {s.title}
                        </h3>

                        {s.letter_message && (
                          <p className="text-xs text-[#9C8490] font-sans line-clamp-3 mb-4 italic leading-relaxed">
                            "{s.letter_message}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-[#9C8490] font-sans py-3 border-t border-white/5">
                          <span className="flex items-center gap-1">
                            <Sparkles size={13} className="text-[#E8C97A]" />
                            {s.questions?.length || 0} Questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {new Date(s.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePreview(s)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#FFFCF9] text-xs font-sans transition-colors cursor-pointer flex items-center gap-1"
                            title="Preview Cinematic"
                          >
                            <Eye size={14} />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-2 rounded-xl bg-[#F4B8C9]/10 hover:bg-[#F4B8C9]/20 text-[#F4B8C9] text-xs font-sans transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit Surprise"
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer flex items-center gap-1 ${
                              s.status === 'published'
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                                : 'bg-[#B83B5E] text-white hover:bg-[#962A48]'
                            }`}
                          >
                            <Send size={12} />
                            <span>{s.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(s.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                            title="Delete Surprise"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {isLoading ? (
              <div className="py-16 text-center text-[#9C8490] text-sm">
                Checking for surprises from {partnerName}...
              </div>
            ) : receivedSurprises.length === 0 ? (
              <Card variant="dark" className="p-10 text-center border-dashed border-white/15 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#E8C97A]/15 text-[#E8C97A] flex items-center justify-center mx-auto mb-4 border border-[#E8C97A]/30">
                  <Sparkles size={28} />
                </div>
                <h3
                  className="text-2xl font-light text-[#FFFCF9] mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  No Surprises Waiting Yet
                </h3>
                <p className="text-xs text-[#9C8490] font-sans max-w-md mx-auto mb-4 leading-relaxed">
                  When {partnerName} creates and publishes a romantic milestone for you, it will appear here ready to experience.
                </p>
                <p className="text-[11px] text-[#C9A45C] font-sans italic">
                  Tip: You can craft a surprise for {partnerName} anytime using the "Surprises I Created" tab! ❤️
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {receivedSurprises.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card
                      variant="dark"
                      className="p-8 border border-[#E8C97A]/30 bg-gradient-to-b from-[#2E2028]/95 to-[#22171E]/95 shadow-xl rounded-3xl space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-[#E8C97A]/15 border border-[#E8C97A]/30 text-[#E8C97A]">
                          <Gift size={26} />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-[#E8C97A] font-sans font-semibold">
                            A GIFT FROM {partnerName.toUpperCase()}
                          </span>
                          <h3
                            className="text-2xl font-light text-[#FFFCF9]"
                            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                          >
                            {s.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs text-[#9C8490] font-sans leading-relaxed">
                        A romantic interactive experience has been crafted specifically for you. Get ready for questions, sweet memories, and a special celebration.
                      </p>

                      <Button
                        variant="primary"
                        onClick={() => handleOpenExperience(s)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs shadow-lg"
                      >
                        <Play size={16} />
                        <span>Experience Cinematic Surprise ✨</span>
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Surprise Editor Modal */}
      {coupleId && currentUserId && (
        <SurpriseEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          coupleId={coupleId}
          creatorId={currentUserId}
          recipientId={recipientId}
          partnerName={partnerName}
          initialSurprise={editingSurprise}
          onSaved={() => loadSurprises()}
          onPreview={(previewSurprise) => {
            setIsEditorOpen(false);
            handlePreview(previewSurprise);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete this surprise?"
        message="This surprise and all its customized questions will be permanently removed."
        confirmText="Delete"
        cancelText="Keep"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Partner Connect Modal */}
      <PartnerConnectModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
      />
    </PageContainer>
  );
}
