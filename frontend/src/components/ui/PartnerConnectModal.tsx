import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Copy,
  Check,
  Share2,
  Sparkles,
  X,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { joinCoupleByInviteCode } from '@/services/relationshipService';
import { Button } from './Button';
import { Input } from './Input';

interface PartnerConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PartnerConnectModal({ isOpen, onClose }: PartnerConnectModalProps) {
  const { couple, loadCouple } = useAuthStore();
  const { showToast } = useToastStore();

  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteCode = couple?.invite_code || (couple?.id ? `LOVE-${couple.id.slice(0, 5).toUpperCase()}` : 'LOVE-WORLD');
  const isPartnerConnected = !!couple?.partner_2_id;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      showToast('Invite code copied to clipboard! 📋', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Code: ' + inviteCode, 'info');
    }
  };

  const handleShareLink = async () => {
    const shareText = `Join my private world on Our World ❤️ Sanctuary code: ${inviteCode}\n${window.location.origin}/login`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Our World ❤️ Join Invitation',
          text: shareText,
          url: window.location.origin,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleJoinWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput.trim()) return;

    setIsJoining(true);
    try {
      const joined = await joinCoupleByInviteCode(partnerCodeInput.trim());
      if (joined) {
        showToast('Connected to your shared world! ❤️', 'success');
        await loadCouple();
        setPartnerCodeInput('');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to connect with this code', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/30 bg-gradient-to-b from-[#2E2028]/95 to-[#241B20]/95 shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#B83B5E]/20 border border-[#B83B5E]/30 text-[#F4B8C9]">
                  <Heart size={22} className="fill-[#B83B5E] text-[#B83B5E]" />
                </div>
                <div>
                  <h2
                    className="text-2xl font-light text-[#FFFCF9]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Connect Your Partner
                  </h2>
                  <p className="text-xs text-[#9C8490] font-sans">Two people • One private digital world</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-[#9C8490] hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Status Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isPartnerConnected ? 'bg-emerald-400' : 'bg-[#E8C97A]'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isPartnerConnected ? 'bg-emerald-500' : 'bg-[#E8C97A]'
                    }`}
                  />
                </span>
                <div>
                  <p className="text-xs font-sans font-medium text-[#FFFCF9]">
                    {isPartnerConnected
                      ? `Connected with ${couple?.partner_name || 'Partner'} ❤️`
                      : 'Waiting for partner to connect'}
                  </p>
                  <p className="text-[11px] font-sans text-[#9C8490]">
                    {isPartnerConnected
                      ? 'Real-time synchronization active'
                      : 'Share your sanctuary invite code below'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
                <ShieldCheck size={14} />
                <span>Private World</span>
              </div>
            </div>

            {/* Section 1: Your Sanctuary Invite Code */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A] flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Your Sanctuary Invite Code</span>
              </label>

              <div className="p-4 rounded-2xl bg-black/40 border border-[#F4B8C9]/30 flex items-center justify-between gap-3">
                <span
                  className="text-2xl sm:text-3xl font-mono tracking-widest text-[#FFFCF9] font-semibold select-all"
                  style={{ letterSpacing: '0.15em' }}
                >
                  {inviteCode}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4B8C9] transition-all cursor-pointer flex items-center gap-1 text-xs font-sans"
                    aria-label="Copy code"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="p-2.5 rounded-xl bg-[#B83B5E]/30 hover:bg-[#B83B5E]/50 text-white transition-all cursor-pointer"
                    aria-label="Share invitation"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#9C8490] font-sans">
                Send this code to your partner so they can connect directly to your shared world.
              </p>
            </div>

            {/* Section 2: Join Partner's World */}
            <div className="pt-4 border-t border-white/10">
              <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A] flex items-center gap-1.5 mb-3">
                <UserPlus size={13} />
                <span>Or Enter Partner's Invite Code</span>
              </label>

              <form onSubmit={handleJoinWorld} className="flex gap-2 items-end">
                <Input
                  id="partner-invite-code"
                  label="Partner Invite Code"
                  placeholder="e.g. LOVE-84920"
                  value={partnerCodeInput}
                  onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 font-mono uppercase"
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isJoining}
                  disabled={!partnerCodeInput.trim()}
                  className="px-5 shrink-0 mb-0.5"
                >
                  Join World ✨
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
