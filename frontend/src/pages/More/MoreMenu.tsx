import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Music, Gift, HelpCircle, HeartHandshake, ArrowLeft, Sparkles } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';

export function MoreMenu() {
  const navigate = useNavigate();

  const features = [
    {
      id: 'events',
      title: 'Events & Countdowns',
      desc: 'Shared calendar, date nights, anniversaries & live count timers.',
      icon: <Calendar size={28} className="text-[#E98DA3]" />,
      route: '/events',
      emoji: '🗓️',
    },
    {
      id: 'playlist',
      title: 'Playlist & Soundtrack',
      desc: 'Our shared music memory soundtrack with Spotify & YouTube links.',
      icon: <Music size={28} className="text-[#C9A45C]" />,
      route: '/playlist',
      emoji: '🎵',
    },
    {
      id: 'gifts',
      title: 'Gifts Wishlist',
      desc: 'Gift-shop wishlist, surprise ideas, and received gift logs.',
      icon: <Gift size={28} className="text-[#E98DA3]" />,
      route: '/gifts',
      emoji: '🎁',
    },
    {
      id: 'quizzes',
      title: 'Quizzes & Trivia',
      desc: 'Playful "How well do you know us?" trivia cards and scoring.',
      icon: <HelpCircle size={28} className="text-[#C9A45C]" />,
      route: '/quizzes',
      emoji: '🎮',
    },
    {
      id: 'birthday',
      title: 'Birthday Cinematic',
      desc: '7-chapter cinematic milestone celebration with flower blooms & letters.',
      icon: <Sparkles size={28} className="text-[#C9A45C]" />,
      route: '/birthday',
      emoji: '🎂',
    },
    {
      id: 'understanding',
      title: 'Understanding Corner',
      desc: 'Calm, non-blame space for working through disagreements together.',
      icon: <HeartHandshake size={28} className="text-[#E98DA3]" />,
      route: '/understanding',
      emoji: '🕊️',
    },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
            OUR WORLD • EXPERIENCES HUB
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            All Experiences & Tools
          </h1>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xs font-sans text-[#9C8490] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back Home</span>
        </button>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {features.map((feat, i) => (
          <motion.div
            key={feat.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => navigate(feat.route)}
            className="glass-card p-6 sm:p-7 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col hover:border-[#E98DA3]/40 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95 transition-all shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                {feat.icon}
              </div>
              <span className="text-3xl">{feat.emoji}</span>
            </div>

            <h2
              className="text-2xl font-serif text-[#FFFCF9] group-hover:text-[#E98DA3] transition-colors mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {feat.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#9C8490] font-sans leading-relaxed mb-6">
              {feat.desc}
            </p>

            <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#C9A45C] font-sans font-medium">
              <span>Open section</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}
