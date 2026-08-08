import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Music, Gift, HelpCircle, HeartHandshake, ArrowLeft, Sparkles } from 'lucide-react';

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
      id: 'understanding',
      title: 'Understanding Corner',
      desc: 'Calm, non-blame space for working through disagreements together.',
      icon: <HeartHandshake size={28} className="text-[#E98DA3]" />,
      route: '/understanding',
      emoji: '🕊️',
    },
  ];

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="text-[#C9A45C]" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 flex-1">
        {features.map((feat) => (
          <motion.div
            key={feat.id}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => navigate(feat.route)}
            className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:border-[#E98DA3]/40 bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/90"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                {feat.icon}
              </div>
              <span className="text-3xl">{feat.emoji}</span>
            </div>

            <div>
              <h2
                className="text-2xl font-serif text-[#FFFCF9] group-hover:text-[#E98DA3] transition-colors mb-2"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {feat.title}
              </h2>
              <p className="text-xs text-[#9C8490] font-sans leading-relaxed">
                {feat.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#C9A45C] font-sans">
              <span>Open section</span>
              <span>→</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
