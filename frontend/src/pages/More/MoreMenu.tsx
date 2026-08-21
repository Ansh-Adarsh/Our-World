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
      icon: <Calendar size={26} className="text-[#E98DA3]" />,
      route: '/events',
      emoji: '🗓️',
    },
    {
      id: 'playlist',
      title: 'Playlist & Soundtrack',
      icon: <Music size={26} className="text-[#C9A45C]" />,
      route: '/playlist',
      emoji: '🎵',
    },
    {
      id: 'gifts',
      title: 'Gifts Wishlist',
      icon: <Gift size={26} className="text-[#E98DA3]" />,
      route: '/gifts',
      emoji: '🎁',
    },
    {
      id: 'quizzes',
      title: 'Quizzes & Trivia',
      icon: <HelpCircle size={26} className="text-[#C9A45C]" />,
      route: '/quizzes',
      emoji: '🎮',
    },
    {
      id: 'surprises',
      title: 'Surprise Workshop',
      icon: <Gift size={26} className="text-[#F4B8C9]" />,
      route: '/surprises',
      emoji: '✨',
    },
    {
      id: 'birthday',
      title: 'Birthday Surprise',
      icon: <Sparkles size={26} className="text-[#C9A45C]" />,
      route: '/birthday',
      emoji: '🎂',
    },
    {
      id: 'understanding',
      title: 'Understanding Corner',
      icon: <HeartHandshake size={26} className="text-[#E98DA3]" />,
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
            All Spaces & Experiences
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {features.map((feat, i) => (
          <motion.div
            key={feat.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(feat.route)}
            className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between hover:border-[#E98DA3]/40 bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95 transition-all shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <span className="text-3xl">{feat.emoji}</span>
            </div>

            <h2
              className="text-2xl font-light text-[#FFFCF9] group-hover:text-[#E98DA3] transition-colors"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {feat.title}
            </h2>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}
