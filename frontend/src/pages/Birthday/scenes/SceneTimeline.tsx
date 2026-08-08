import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  icon?: string;
}

interface SceneTimelineProps {
  events: TimelineEvent[];
  onNext: () => void;
}

const DEFAULT_TIMELINE: TimelineEvent[] = [
  {
    id: '1',
    title: 'The First Hello',
    date: 'Day One',
    description: 'When two separate worlds gently collided over a humble cup of coffee.',
  },
  {
    id: '2',
    title: 'First Shared Road Trip',
    date: 'Milestone',
    description: 'Late night singalongs, wrong turns, and endless laughter along open highways.',
  },
  {
    id: '3',
    title: 'Building Our Digital Sanctuary',
    date: 'Our World',
    description: 'Creating this quiet little universe where every memory, note, and song belongs strictly to us.',
  },
  {
    id: '4',
    title: 'Today & Beyond',
    date: 'Your Birthday',
    description: 'Celebrating another year of your light, warmth, and beautiful soul.',
  },
];

export function SceneTimeline({ events, onNext }: SceneTimelineProps) {
  const displayEvents = events.length > 0 ? events : DEFAULT_TIMELINE;

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#C9A45C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-[#B83B5E]/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-4"
      >
        <p className="text-xs text-[#C9A45C] font-sans tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Calendar size={13} />
          CHAPTER III • THE TIMELINE OF US
        </p>
        <h2
          className="text-2xl sm:text-3xl text-[#FFFCF9] font-serif mt-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Our Journey So Far
        </h2>
      </motion.div>

      {/* Vertical Animated Timeline */}
      <div className="relative z-10 my-auto w-full max-w-md mx-auto py-6">
        <div className="relative border-l border-[#C9A45C]/30 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-8 text-left">
          {displayEvents.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.4 + 0.3 }}
              className="relative group"
            >
              {/* Timeline node marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-[#1A1015] border-2 border-[#C9A45C] flex items-center justify-center group-hover:scale-125 transition-transform">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]" />
              </div>

              <div className="glass-card p-4 rounded-2xl border border-white/10 bg-[#241B20]/80 hover:border-[#E98DA3]/40 transition-colors">
                <span className="text-[10px] text-[#C9A45C] font-sans uppercase tracking-wider block mb-1">
                  {item.date}
                </span>
                <h3
                  className="text-lg text-[#FFFCF9] font-serif"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-xs text-[#9C8490] font-sans mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Action */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2.2 }}
        className="relative z-10 pb-6"
      >
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-[#FFFCF9] text-xs font-sans tracking-wider uppercase hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
        >
          <span>Read Birthday Letter</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
