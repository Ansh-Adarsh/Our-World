import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  Shield,
  Bell,
  Sparkles,
  LogOut,
  ArrowLeft,
  Calendar,
  Lock,
  HardDrive,
  Edit3,
  UserPlus,
  X,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { updateCoupleDetails, createCoupleRecord } from '@/services/relationshipService';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PartnerConnectModal } from '@/components/ui/PartnerConnectModal';

export function Settings() {
  const navigate = useNavigate();
  const { user, couple, signOut, updateDisplayName, setCouple, loadCouple } = useAuthStore();
  const { showToast } = useToastStore();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('our_world_sound') !== 'false';
  });
  const [petalsEnabled, setPetalsEnabled] = useState(() => {
    return localStorage.getItem('our_world_petals') !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  // Edit Profile Modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Edit Couple Details Modal state
  const [isEditCoupleOpen, setIsEditCoupleOpen] = useState(false);
  const [editCoupleName, setEditCoupleName] = useState('');
  const [editAnniversaryDate, setEditAnniversaryDate] = useState('');
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerBirthday, setEditPartnerBirthday] = useState('');
  const [isSavingCouple, setIsSavingCouple] = useState(false);

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'Partner';
  const coupleTitle = couple?.couple_name || 'Our Shared Sanctuary';

  useEffect(() => {
    if (user?.profile?.display_name) {
      setEditDisplayName(user.profile.display_name);
    }
  }, [user]);

  useEffect(() => {
    if (couple) {
      setEditCoupleName(couple.couple_name || '');
      setEditAnniversaryDate(couple.anniversary_date || '');
      setEditPartnerName(couple.partner_name || '');
      setEditPartnerBirthday(couple.partner_birthday || '');
    }
  }, [couple]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('our_world_sound', String(next));
    showToast(next ? 'Sound effects enabled 🔔' : 'Sound effects muted 🔕', 'info');
  };

  const togglePetals = () => {
    const next = !petalsEnabled;
    setPetalsEnabled(next);
    localStorage.setItem('our_world_petals', String(next));
    showToast(next ? 'Ambient floating petals active 🌸' : 'Ambient petals paused', 'info');
  };

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      showToast('Signed out safely. See you soon! ❤️', 'success');
      navigate('/login', { replace: true });
    } catch (err: any) {
      showToast(err.message || 'Error signing out', 'error');
    } finally {
      setIsSigningOut(false);
      setIsSignOutModalOpen(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditDisplayName(displayName);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editDisplayName.trim();
    if (!trimmed) {
      showToast('Display name cannot be empty', 'error');
      return;
    }
    if (trimmed.length > 50) {
      showToast('Display name must be 50 characters or less', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateDisplayName(trimmed);
      showToast('Display name updated successfully ✨', 'success');
      setIsEditProfileOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update display name', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenEditCouple = () => {
    if (couple) {
      setEditCoupleName(couple.couple_name || '');
      setEditAnniversaryDate(couple.anniversary_date || '');
      setEditPartnerName(couple.partner_name || '');
      setEditPartnerBirthday(couple.partner_birthday || '');
    }
    setIsEditCoupleOpen(true);
  };

  const handleSaveCouple = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSavingCouple(true);
    try {
      let updated: any = null;
      if (couple?.id) {
        updated = await updateCoupleDetails(couple.id, {
          couple_name: editCoupleName.trim() || null,
          anniversary_date: editAnniversaryDate || null,
          partner_name: editPartnerName.trim() || null,
          partner_birthday: editPartnerBirthday || null,
        });
      } else {
        // Auto-create sanctuary record for the user if one doesn't exist yet!
        updated = await createCoupleRecord({
          coupleName: editCoupleName.trim() || 'Our Shared Sanctuary',
          anniversaryDate: editAnniversaryDate || undefined,
          partnerName: editPartnerName.trim() || undefined,
          partnerBirthday: editPartnerBirthday || undefined,
        });
      }

      if (updated) {
        setCouple(updated);
      }
      await loadCouple();
      showToast('Sanctuary details updated successfully ❤️', 'success');
      setIsEditCoupleOpen(false);
    } catch (err: any) {
      console.error('[Settings] Error saving couple:', err);
      showToast(err.message || 'Failed to update sanctuary details', 'error');
    } finally {
      setIsSavingCouple(false);
    }
  };

  return (
    <PageContainer>
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#E8C97A]/10 blur-3xl" />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
            OUR WORLD • SETTINGS & PREFERENCES
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Sanctuary Settings
          </h1>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-sans text-[#9C8490] hover:text-[#F4B8C9] hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back Home</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 pb-12">
        {/* Section 1: Account & User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card variant="dark" className="p-6 sm:p-8 h-full flex flex-col justify-between border border-[#F4B8C9]/20 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#F4B8C9]/10 border border-[#F4B8C9]/20 text-[#F4B8C9]">
                    <User size={22} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-light text-[#FFFCF9]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Account & Profile
                    </h2>
                    <p className="text-xs text-[#9C8490] font-sans">Your authenticated profile</p>
                  </div>
                </div>

                <button
                  id="edit-profile-btn"
                  onClick={handleOpenEditProfile}
                  className="px-3 py-1.5 rounded-lg bg-[#F4B8C9]/10 border border-[#F4B8C9]/30 text-xs text-[#F4B8C9] hover:bg-[#F4B8C9]/20 transition-all flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Edit3 size={13} />
                  <span>Edit Name</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-sans text-[#9C8490]">Display Name</span>
                  <span className="text-sm font-sans font-medium text-[#FFFCF9]">{displayName}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-sans text-[#9C8490]">Account Email</span>
                  <span className="text-sm font-sans text-[#E98DA3]">{user?.email || 'Authenticated User'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-sans text-[#9C8490]">Security Status</span>
                  <span className="text-xs font-sans text-emerald-400 font-medium flex items-center gap-1.5">
                    <Shield size={13} /> Active & Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <Button
                variant="danger"
                onClick={() => setIsSignOutModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-xs py-3"
              >
                <LogOut size={16} />
                <span>Sign Out of Our World</span>
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Section 2: Our World & Relationship Details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card variant="dark" className="p-6 sm:p-8 h-full flex flex-col justify-between border border-[#F4B8C9]/20 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#B83B5E]/15 border border-[#B83B5E]/30 text-[#F4B8C9]">
                    <Heart size={22} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-light text-[#FFFCF9]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Our World Space
                    </h2>
                    <p className="text-xs text-[#9C8490] font-sans">Shared relationship details</p>
                  </div>
                </div>

                <button
                  id="edit-couple-btn"
                  onClick={handleOpenEditCouple}
                  className="px-3 py-1.5 rounded-lg bg-[#F4B8C9]/10 border border-[#F4B8C9]/30 text-xs text-[#F4B8C9] hover:bg-[#F4B8C9]/20 transition-all flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Edit3 size={13} />
                  <span>Edit Details</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-sans text-[#9C8490]">World Name</span>
                  <span className="text-sm font-sans font-medium text-[#FFFCF9]">{coupleTitle}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-sans text-[#9C8490]">Anniversary Date</span>
                  <span className="text-sm font-sans text-[#E8C97A] flex items-center gap-1.5">
                    <Calendar size={14} />
                    {couple?.anniversary_date || 'Not set'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-sans text-[#9C8490]">Partner Name</span>
                  <span className="text-sm font-sans font-medium text-[#F4B8C9]">{couple?.partner_name || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-sans text-[#9C8490]">Partner Birthday</span>
                  <span className="text-sm font-sans text-[#FFFCF9]">{couple?.partner_birthday || 'Not set'}</span>
                </div>

                {/* Sanctuary Invite Code Card */}
                <div className="p-3.5 rounded-xl bg-[#F4B8C9]/10 border border-[#F4B8C9]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#E8C97A] font-sans font-semibold">
                      Sanctuary Invite Code
                    </span>
                    <p className="text-base font-mono font-bold text-[#FFFCF9] tracking-wider">
                      {couple?.invite_code || 'LOVE-WORLD'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPartnerModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#B83B5E] text-white text-xs font-sans hover:bg-[#922B48] transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                  >
                    <UserPlus size={13} />
                    <span>Pair Partner</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#9C8490]/70 font-sans mt-4">
              ✨ You and your partner share the same world ID. Any changes here sync in real-time.
            </p>
          </Card>
        </motion.div>

        {/* Section 3: Preferences & Atmosphere */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card variant="dark" className="p-6 sm:p-8 border border-[#F4B8C9]/20 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-[#E8C97A]/10 border border-[#E8C97A]/20 text-[#E8C97A]">
                <Sparkles size={22} />
              </div>
              <div>
                <h2
                  className="text-2xl font-light text-[#FFFCF9]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Atmosphere & Reminders
                </h2>
                <p className="text-xs text-[#9C8490] font-sans">Customize your experience</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-sans font-medium text-[#FFFCF9]">Ambient Floating Petals</p>
                  <p className="text-xs font-sans text-[#9C8490] mt-0.5">Gentle romantic sakura petals drifting in background</p>
                </div>
                <button
                  onClick={togglePetals}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    petalsEnabled ? 'bg-[#B83B5E]' : 'bg-white/10'
                  }`}
                  aria-label="Toggle ambient petals"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      petalsEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-sans font-medium text-[#FFFCF9]">Sound Effects & Melodies</p>
                  <p className="text-xs font-sans text-[#9C8490] mt-0.5">Subtle audio cues during milestones and surprises</p>
                </div>
                <button
                  onClick={toggleSound}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    soundEnabled ? 'bg-[#B83B5E]' : 'bg-white/10'
                  }`}
                  aria-label="Toggle sound effects"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      soundEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-sans font-medium text-[#FFFCF9]">Anniversary & Event Alerts</p>
                  <p className="text-xs font-sans text-[#9C8490] mt-0.5">Countdown notifications for upcoming dates and milestones</p>
                </div>
                <button
                  onClick={() => {
                    const next = !notificationsEnabled;
                    setNotificationsEnabled(next);
                    showToast(next ? 'Notifications active 🔔' : 'Notifications muted', 'info');
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    notificationsEnabled ? 'bg-[#B83B5E]' : 'bg-white/10'
                  }`}
                  aria-label="Toggle notifications"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      notificationsEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 4: Privacy & Storage Security */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <Card variant="dark" className="p-6 sm:p-8 border border-[#F4B8C9]/20 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Shield size={22} />
              </div>
              <div>
                <h2
                  className="text-2xl font-light text-[#FFFCF9]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Privacy & Storage
                </h2>
                <p className="text-xs text-[#9C8490] font-sans">Couple-isolated cryptographic security</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                <Lock size={18} className="text-[#F4B8C9] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-sans font-medium text-[#FFFCF9]">Private Storage Buckets</p>
                  <p className="text-xs font-sans text-[#9C8490] mt-0.5 leading-relaxed">
                    Photos in <code className="text-[#F4B8C9]">memories-photos</code> and audio tracks in <code className="text-[#F4B8C9]">playlist-audio</code> are 100% private and accessible only by you and your partner via time-limited signed tokens.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                <HardDrive size={18} className="text-[#E8C97A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-sans font-medium text-[#FFFCF9]">Row Level Security (RLS)</p>
                  <p className="text-xs font-sans text-[#9C8490] mt-0.5 leading-relaxed">
                    PostgreSQL database policies enforce strict couple boundary isolation. No unrelated user can read, write, or query your relationship data.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                <Bell size={18} className="text-[#E98DA3] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-sans font-medium text-[#FFFCF9]">Private Diary Zero-Knowledge</p>
                  <p className="text-xs font-sans text-[#9C8490] mt-0.5 leading-relaxed">
                    Personal diary entries marked as <span className="text-white font-medium">PRIVATE</span> are locked exclusively to the author's user ID at database layer.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md glass-card p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#F4B8C9]/10 text-[#F4B8C9]">
                    <User size={18} />
                  </div>
                  <h3
                    className="text-2xl font-light text-[#FFFCF9]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Edit Display Name
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <Input
                  id="edit-display-name-input"
                  label="Display Name"
                  placeholder="e.g. Ansh"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  autoFocus
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditProfileOpen(false)}
                    disabled={isSavingProfile}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="save-profile-btn"
                    type="submit"
                    variant="primary"
                    isLoading={isSavingProfile}
                    disabled={!editDisplayName.trim() || isSavingProfile}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} />
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Couple Details Modal */}
      <AnimatePresence>
        {isEditCoupleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditCoupleOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg glass-card p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#B83B5E]/20 text-[#F4B8C9]">
                    <Heart size={18} />
                  </div>
                  <h3
                    className="text-2xl font-light text-[#FFFCF9]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Edit Sanctuary Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditCoupleOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCouple} className="space-y-4">
                <Input
                  id="edit-couple-name-input"
                  label="World / Sanctuary Title"
                  placeholder="e.g. Our Shared Sanctuary"
                  value={editCoupleName}
                  onChange={(e) => setEditCoupleName(e.target.value)}
                  autoFocus
                />

                <Input
                  id="edit-anniversary-date-input"
                  type="date"
                  label="Anniversary Date"
                  value={editAnniversaryDate}
                  onChange={(e) => setEditAnniversaryDate(e.target.value)}
                />

                <Input
                  id="edit-partner-name-input"
                  label="Partner's Name or Nickname"
                  placeholder="e.g. Maya"
                  value={editPartnerName}
                  onChange={(e) => setEditPartnerName(e.target.value)}
                />

                <Input
                  id="edit-partner-birthday-input"
                  type="date"
                  label="Partner's Birthday"
                  value={editPartnerBirthday}
                  onChange={(e) => setEditPartnerBirthday(e.target.value)}
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditCoupleOpen(false)}
                    disabled={isSavingCouple}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="save-couple-btn"
                    type="submit"
                    variant="primary"
                    isLoading={isSavingCouple}
                    disabled={isSavingCouple}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} />
                    <span>Save Sanctuary</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partner Connection Modal */}
      <PartnerConnectModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
      />

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSignOutModalOpen}
        title="Sign Out of Our World?"
        message="Your memories, songs, and notes will remain securely protected and synced for when you return."
        confirmText="Sign Out"
        cancelText="Stay"
        isDestructive={false}
        isLoading={isSigningOut}
        onConfirm={handleSignOutConfirm}
        onCancel={() => setIsSignOutModalOpen(false)}
      />
    </PageContainer>
  );
}

