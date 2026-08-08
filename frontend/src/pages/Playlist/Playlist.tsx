import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Plus, ExternalLink, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchPlaylistSongs, addPlaylistSong } from '@/services/playlistService';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PlaylistSong } from '@/types';

export function Playlist() {
  const { user, couple } = useAuthStore();
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const coupleId = couple?.id || 'demo-couple';
      const data = await fetchPlaylistSongs(coupleId);
      setSongs(data);
      setIsLoading(false);
    }
    loadData();
  }, [couple?.id]);

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !user) return;

    setIsSubmitting(true);
    const coupleId = couple?.id || 'demo-couple';

    const newSong = await addPlaylistSong({
      coupleId,
      addedById: user.id,
      title,
      artist,
      linkUrl,
      note,
    });

    if (newSong) {
      setSongs((prev) => [newSong, ...prev]);
    }

    setTitle('');
    setArtist('');
    setLinkUrl('');
    setNote('');
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-dvh bg-our-world px-5 py-8 sm:px-10 md:px-16 lg:px-20 sm:py-10 w-full flex flex-col">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#C9A45C]/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1">
            <Music size={14} className="text-[#C9A45C]" />
            OUR WORLD • PLAYLIST
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#FFFCF9]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Our Shared Soundtrack
          </h1>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Song</span>
        </Button>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading songs...
          </div>
        ) : songs.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#E98DA3]/20">
            <FlowerAccent variant="rose" size={48} color="#E98DA3" opacity={0.3} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2">No songs added yet</h3>
            <p className="text-sm text-[#9C8490] font-sans mb-6">
              Add your favorite memory songs, road trip anthems, or love ballads.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Add First Song 🎵
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song) => (
              <motion.div
                key={song.id}
                whileHover={{ y: -4 }}
                className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between hover:border-[#E98DA3]/40 bg-gradient-to-b from-[#2E2028]/80 to-[#241B20]/90"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#B83B5E] to-[#C9A45C] flex items-center justify-center text-white shadow-lg shrink-0">
                    <Music size={22} />
                  </div>
                  {song.link_url && (
                    <a
                      href={song.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#E98DA3] hover:bg-white/15 transition-colors"
                      title="Listen to Song"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                <div className="mb-4">
                  <h3
                    className="text-2xl font-serif text-[#FFFCF9] mb-1"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {song.title}
                  </h3>
                  <p className="text-xs text-[#E98DA3] font-sans font-semibold tracking-wide mb-2">
                    {song.artist}
                  </p>
                  {song.note && (
                    <p className="text-xs text-[#9C8490] font-sans leading-relaxed italic border-l-2 border-[#C9A45C]/40 pl-3 py-1">
                      "{song.note}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#9C8490]">
                  <span>Added with ❤️</span>
                  <span>{new Date(song.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ADD SONG MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#E98DA3]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <Sparkles size={20} className="text-[#C9A45C]" />
                  Add Song to Playlist
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSong} className="space-y-4">
                <Input
                  id="song-title"
                  label="Song Title"
                  placeholder="e.g. Lover"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <Input
                  id="song-artist"
                  label="Artist"
                  placeholder="e.g. Taylor Swift"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  required
                />

                <Input
                  id="song-link"
                  label="Link URL (Spotify, Apple Music, YouTube)"
                  placeholder="https://open.spotify.com/track/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#C9A45C]">
                    Special Note / Memory
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1A1015]/80 border border-white/10 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#E98DA3] placeholder-[#9C8490]/50"
                    placeholder="Why is this song special for us?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Add Song 🎵
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
