import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function Settings() {
  const navigate = useNavigate();
  const { user, couple, signOut } = useAuthStore();
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

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'Partner';
  const coupleTitle = couple?.couple_name || 'Our Shared Sanctuary';

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
              <div className="flex items-center gap-3 mb-6">
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
                  <p className="text-xs text-[#9C8490] font-sans">Your authenticated session</p>
                </div>
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
                  onClick={() => navigate('/onboarding')}
                  className="px-3 py-1.5 rounded-lg bg-[#F4B8C9]/10 border border-[#F4B8C9]/30 text-xs text-[#F4B8C9] hover:bg-[#F4B8C9]/20 transition-all flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
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
              </div>
            </div>

            <p className="text-[11px] text-[#9C8490]/70 font-sans mt-4">
              ✨ You can update names, anniversary date, or partner birthday at any time from Onboarding Details.
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
