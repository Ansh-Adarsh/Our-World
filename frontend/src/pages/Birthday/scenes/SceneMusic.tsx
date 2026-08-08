import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Music, Play, Pause, ExternalLink } from 'lucide-react';

interface SongInfo {
  title: string;
  artist: string;
  link?: string;
  note?: string;
}

interface SceneMusicProps {
  topSong?: SongInfo;
  onNext: () => void;
}

const DEFAULT_SONG: SongInfo = {
  title: 'Our Favorite Song',
  artist: 'The Couple Soundtrack',
  link: 'https://open.spotify.com',
  note: 'Playing in our hearts every day.',
};

export function SceneMusic({ topSong, onNext }: SceneMusicProps) {
  const song = topSong?.title ? topSong : DEFAULT_SONG;
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9A45C]/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-4"
      >
        <p className="text-xs text-[#C9A45C] font-sans tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Music size={13} />
          CHAPTER V • THE SOUNDTRACK OF US
        </p>
        <h2
          className="text-2xl sm:text-3xl text-[#FFFCF9] font-serif mt-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Press Play On Our Song
        </h2>
      </motion.div>

      {/* Vinyl Record / Music Player Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-10 my-auto w-full max-w-sm mx-auto glass-card p-8 rounded-3xl border border-white/10 bg-[#241B20]/90 shadow-2xl flex flex-col items-center"
      >
        {/* Animated Vinyl Record */}
        <div className="relative w-40 h-40 mb-6">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full bg-gradient-to-tr from-black via-[#1F151B] to-[#3B2531] border-4 border-[#C9A45C]/40 shadow-xl flex items-center justify-center relative overflow-hidden"
          >
            {/* Record grooves */}
            <div className="w-32 h-32 rounded-full border border-white/5" />
            <div className="w-24 h-24 rounded-full border border-white/10" />
            <div className="w-12 h-12 rounded-full bg-[#C9A45C]/30 border border-[#C9A45C] flex items-center justify-center">
              <Music size={16} className="text-[#C9A45C]" />
            </div>
          </motion.div>

          {/* Equalizer bars when playing */}
          {isPlaying && (
            <div className="absolute -bottom-3 inset-x-0 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [6, 20, 8, 24, 6] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1 bg-[#E98DA3] rounded-full"
                />
              ))}
            </div>
          )}
        </div>

        <h3
          className="text-xl text-[#FFFCF9] font-serif"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {song.title}
        </h3>
        <p className="text-xs text-[#9C8490] font-sans mt-0.5 mb-2">{song.artist}</p>

        {song.note && (
          <p className="text-[11px] text-[#C9A45C] font-sans italic bg-white/5 px-3 py-1 rounded-full mb-6">
            "{song.note}"
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
          </button>

          {song.link && (
            <a
              href={song.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-white/10 text-[#9C8490] hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Open full track"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </motion.div>

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
          <span>Final Reveal</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
