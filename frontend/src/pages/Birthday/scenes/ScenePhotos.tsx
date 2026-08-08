import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  caption?: string;
  date?: string;
}

interface ScenePhotosProps {
  photos: PhotoItem[];
  onNext: () => void;
}

const DEFAULT_PHOTOS: PhotoItem[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
    title: 'Golden Sunset Walk',
    caption: 'Walking hand in hand into the golden horizon.',
    date: 'Summer 2024',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=800',
    title: 'Cozy Morning Coffee',
    caption: 'Warm quiet mornings with your laugh filling the room.',
    date: 'Autumn 2024',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
    title: 'Under The Starlight',
    caption: 'Making wishes together under a sea of endless stars.',
    date: 'Winter 2024',
  },
];

export function ScenePhotos({ photos, onNext }: ScenePhotosProps) {
  const displayPhotos = photos.length > 0 ? photos : DEFAULT_PHOTOS;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [displayPhotos.length]);

  const current = displayPhotos[currentIndex];

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#5A2435]/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-4"
      >
        <p className="text-xs text-[#C9A45C] font-sans tracking-widest uppercase flex items-center justify-center gap-1.5">
          <ImageIcon size={13} />
          CHAPTER II • MEMORY REVEAL ({currentIndex + 1} / {displayPhotos.length})
        </p>
        <h2
          className="text-2xl sm:text-3xl text-[#FFFCF9] font-serif mt-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Moments Frozen in Time
        </h2>
      </motion.div>

      {/* Central Photo Carousel */}
      <div className="relative z-10 my-auto w-full max-w-lg mx-auto flex flex-col items-center">
        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-[#E98DA3]/30 shadow-2xl bg-black/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id || currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={current.url}
                alt={current.title}
                className="w-full h-full object-cover"
              />
              {/* Subtle vignette gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Caption Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-5 text-left bg-gradient-to-t from-[#1A1015] to-transparent">
            <span className="text-[10px] text-[#C9A45C] font-sans uppercase tracking-wider block mb-1">
              {current.date || 'Memory Snapshot'}
            </span>
            <h3
              className="text-xl text-[#FFFCF9] font-serif"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {current.title}
            </h3>
            {current.caption && (
              <p className="text-xs text-[#9C8490] font-sans mt-1 line-clamp-2">
                "{current.caption}"
              </p>
            )}
          </div>
        </div>

        {/* Manual controls */}
        <div className="flex items-center gap-4 mt-4 text-[#9C8490]">
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length)
            }
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1.5">
            {displayPhotos.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-[#C9A45C] w-6' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % displayPhotos.length)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Bottom Action */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pb-6"
      >
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-[#FFFCF9] text-xs font-sans tracking-wider uppercase hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
        >
          <span>View Our Timeline</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
