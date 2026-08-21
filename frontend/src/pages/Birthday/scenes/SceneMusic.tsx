import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Music, Play, Pause, ExternalLink, SkipBack, SkipForward, Disc3 } from 'lucide-react';

export interface SongInfo {
  title: string;
  artist: string;
  link?: string;
  note?: string;
}

interface SceneMusicProps {
  songs?: SongInfo[];
  topSong?: SongInfo;
  onNext: () => void;
}

const DEFAULT_SONGS: SongInfo[] = [
  {
    title: 'Our Special Song',
    artist: 'Sanctuary Soundtrack',
    link: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112199.mp3',
    note: 'Playing in our hearts every single day ❤️',
  },
  {
    title: 'Love Theme',
    artist: 'Acoustic Serenade',
    link: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=gentle-romantic-acoustic-guitar-10331.mp3',
    note: 'The sweetest melody of our story together ✨',
  },
  {
    title: 'Forever & Always',
    artist: 'Midnight Symphony',
    link: 'https://cdn.pixabay.com/download/audio/2021/11/24/audio_32b09a63aa.mp3?filename=piano-moment-9835.mp3',
    note: 'For every sunset, laugh, and tomorrow morning 🌅',
  },
];

export function SceneMusic({ songs = [], topSong, onNext }: SceneMusicProps) {
  // Combine all songs, prioritizing provided list or single topSong
  let playlist: SongInfo[] = [];
  if (songs && songs.length > 0) {
    playlist = songs;
  } else if (topSong?.title) {
    playlist = [topSong];
  } else {
    playlist = DEFAULT_SONGS;
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = playlist[currentIndex] || playlist[0];

  const isDirectAudio = Boolean(
    currentSong.link &&
      (currentSong.link.startsWith('http') ||
        currentSong.link.startsWith('data:') ||
        currentSong.link.startsWith('blob:')) &&
      !currentSong.link.includes('spotify.com') &&
      !currentSong.link.includes('youtube.com') &&
      !currentSong.link.includes('youtu.be')
  );

  // Play a specific song by index
  const playTrack = (index: number, shouldAutoPlay = true) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setCurrentIndex(index);

    const targetSong = playlist[index];
    const isTargetDirect = Boolean(
      targetSong?.link &&
        (targetSong.link.startsWith('http') ||
          targetSong.link.startsWith('data:') ||
          targetSong.link.startsWith('blob:')) &&
        !targetSong.link.includes('spotify.com') &&
        !targetSong.link.includes('youtube.com') &&
        !targetSong.link.includes('youtu.be')
    );

    if (shouldAutoPlay && isTargetDirect && targetSong.link) {
      const audio = new Audio(targetSong.link);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
          setDuration(audio.duration);
        }
      };
      audio.onended = () => {
        // Auto-advance to next song in playlist like photos
        handleNextTrack(true);
      };
      audio.onerror = () => {
        console.warn('[SceneMusic] Audio error for:', targetSong.link);
      };
      audioRef.current = audio;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(true));
    } else if (shouldAutoPlay) {
      setIsPlaying(true);
    }
  };

  const handleNextTrack = (autoPlay = isPlaying) => {
    const nextIdx = (currentIndex + 1) % playlist.length;
    playTrack(nextIdx, autoPlay);
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(prevIdx, isPlaying);
  };

  const togglePlay = () => {
    if (isDirectAudio && currentSong.link) {
      if (!audioRef.current) {
        const audio = new Audio(currentSong.link);
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
            setDuration(audio.duration);
          }
        };
        audio.onended = () => handleNextTrack(true);
        audio.onerror = () => {
          console.warn('[SceneMusic] Audio playback error for source:', currentSong.link);
        };
        audioRef.current = audio;
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('[SceneMusic] Play request notice:', err.message);
            setIsPlaying(true);
          });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between p-6 sm:p-10 text-center overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9A45C]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#B83B5E]/15 rounded-full blur-3xl" />
      </div>

      {/* Header with track counter (Like Photo Memories) */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 pt-4"
      >
        <p className="text-xs text-[#C9A45C] font-sans tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Music size={13} />
          SOUNDTRACK OF US • TRACK {currentIndex + 1} OF {playlist.length}
        </p>
        <h2
          className="text-2xl sm:text-3xl text-[#FFFCF9] font-serif mt-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Our Melody & Melodies
        </h2>
      </motion.div>

      {/* Central Vinyl Player Card with Next/Prev Options */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 my-auto w-full max-w-md mx-auto glass-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#241B20]/95 shadow-2xl flex flex-col items-center"
      >
        {/* Animated Vinyl Record */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-6">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full bg-gradient-to-tr from-black via-[#1F151B] to-[#3B2531] border-4 border-[#C9A45C]/40 shadow-2xl flex items-center justify-center relative overflow-hidden"
          >
            {/* Record grooves */}
            <div className="w-32 h-32 rounded-full border border-white/5" />
            <div className="w-24 h-24 rounded-full border border-white/10" />
            <div className="w-12 h-12 rounded-full bg-[#C9A45C]/30 border border-[#C9A45C] flex items-center justify-center">
              <Disc3 size={18} className="text-[#C9A45C]" />
            </div>
          </motion.div>

          {/* Equalizer bars when playing */}
          {isPlaying && (
            <div className="absolute -bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20">
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [6, 22, 10, 26, 6] }}
                  transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.12 }}
                  className="w-1 bg-gradient-to-t from-[#B83B5E] to-[#E98DA3] rounded-full shadow-sm"
                />
              ))}
            </div>
          )}
        </div>

        {/* Track Title & Artist with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-center w-full"
          >
            <h3
              className="text-xl sm:text-2xl text-[#FFFCF9] font-serif truncate px-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {currentSong.title}
            </h3>
            <p className="text-xs text-[#9C8490] font-sans mt-0.5 mb-2 truncate px-4">
              {currentSong.artist}
            </p>

            {currentSong.note && (
              <p className="text-[11px] text-[#C9A45C] font-sans italic bg-white/5 px-3.5 py-1.5 rounded-full mb-4 inline-block max-w-full truncate border border-[#C9A45C]/20">
                "{currentSong.note}"
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Audio Progress Bar */}
        {duration > 0 && (
          <div className="w-full bg-white/10 h-1.5 rounded-full mb-5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Full Player Controls (Previous, Play/Pause, Next, External) */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2">
          {/* Previous Track Button */}
          {playlist.length > 1 && (
            <button
              onClick={handlePrevTrack}
              className="p-3 rounded-full bg-white/10 text-[#9C8490] hover:text-white hover:bg-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Previous Audio"
            >
              <SkipBack size={18} />
            </button>
          )}

          {/* Play / Pause Toggle Button */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#B83B5E] to-[#C9A45C] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
          </button>

          {/* Next Track Button */}
          {playlist.length > 1 && (
            <button
              onClick={() => handleNextTrack(isPlaying)}
              className="p-3 rounded-full bg-white/10 text-[#9C8490] hover:text-white hover:bg-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Next Audio"
            >
              <SkipForward size={18} />
            </button>
          )}

          {/* External Track Link (if available) */}
          {currentSong.link && !isDirectAudio && (
            <a
              href={currentSong.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-white/10 text-[#9C8490] hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Open Track Link"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>

        {/* Track Selection Dots (Like Photo Memories) */}
        {playlist.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {playlist.map((_, idx) => (
              <button
                key={idx}
                onClick={() => playTrack(idx, isPlaying)}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 h-1.5 bg-[#C9A45C]'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
                title={`Track ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Bottom Action */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 pb-6"
      >
        <button
          onClick={onNext}
          className="px-7 py-3.5 rounded-full bg-gradient-to-r from-white/10 to-white/15 border border-white/20 text-[#FFFCF9] text-xs font-sans tracking-widest uppercase hover:bg-white/25 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-lg"
        >
          <span>Final Reveal</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
