import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Pencil, Bot, ShieldCheck } from 'lucide-react';

interface HumanApprovalModalProps {
  isOpen: boolean;
  agentName: string;
  intent: string;
  draftContent: string;
  onApprove: (content: string) => void;
  onReject: () => void;
}

/**
 * HumanApprovalModal — Phase 4 Mandatory Human-in-the-Loop Interface.
 *
 * All AI-generated content MUST pass through this component before
 * being saved or sent. Nothing auto-publishes.
 */
export function HumanApprovalModal({
  isOpen,
  agentName,
  intent,
  draftContent,
  onApprove,
  onReject,
}: HumanApprovalModalProps) {
  const [editedContent, setEditedContent] = useState(draftContent);
  const [isEditing, setIsEditing] = useState(false);

  // Sync when draft changes from parent
  if (draftContent !== editedContent && !isEditing) {
    setEditedContent(draftContent);
  }

  const friendlyIntent: Record<string, string> = {
    memory_caption: 'Memory Caption',
    love_letter: 'Love Letter Draft',
    quiz_suggestion: 'Quiz Question Suggestion',
    story_narrative: 'Story Narrative',
    surprise_idea: 'Surprise Date Idea',
    birthday_experience: 'Birthday Experience',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-lg bg-[#1A1015] border border-[#E98DA3]/40 rounded-3xl p-6 sm:p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/20 border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C]">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="text-lg text-[#FFFCF9] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    AI Draft: {friendlyIntent[intent] ?? intent}
                  </h2>
                  <p className="text-xs text-[#9C8490] font-sans flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={11} className="text-[#C9A45C]" />
                    {agentName} · Human approval required
                  </p>
                </div>
              </div>
            </div>

            {/* Approval Notice Banner */}
            <div className="mb-5 px-4 py-2.5 rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-xs text-[#C9A45C] font-sans flex items-center gap-2">
              <Sparkles size={14} className="shrink-0" />
              <span>Review this AI draft carefully. <strong>Nothing is saved until you approve it.</strong></span>
            </div>

            {/* Draft Content */}
            <div className="mb-6">
              {isEditing ? (
                <textarea
                  rows={5}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-[#241B20] border border-[#E98DA3]/40 rounded-2xl p-4 text-sm text-[#FFFCF9] font-sans leading-relaxed focus:outline-none focus:border-[#E98DA3] resize-none"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-[#241B20] border border-white/10 rounded-2xl p-4 text-sm text-[#FFF8F2] font-sans leading-relaxed cursor-text hover:border-[#E98DA3]/30 transition-colors min-h-[100px]"
                >
                  <p className="whitespace-pre-wrap">{editedContent}</p>
                  <p className="text-[10px] text-[#9C8490]/60 mt-3 flex items-center gap-1">
                    <Pencil size={10} /> Click to edit before approving
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Reject */}
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-sans hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <X size={16} />
                Reject
              </button>

              {/* Edit toggle */}
              <button
                onClick={() => setIsEditing((e) => !e)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-white/15 bg-white/5 text-[#9C8490] text-sm font-sans hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <Pencil size={15} />
                {isEditing ? 'Preview' : 'Edit'}
              </button>

              {/* Approve */}
              <button
                onClick={() => onApprove(editedContent)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] text-white text-sm font-sans font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
              >
                <Check size={16} />
                Approve ✨
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
