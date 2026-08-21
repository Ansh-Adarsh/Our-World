import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Plus,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  X,
  Edit3,
  Trash2,
  MoreVertical,
  Radio,
  FileAudio,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import {
  fetchPlaylistSongs,
  addPlaylistSong,
  updatePlaylistSong,
  deletePlaylistSong,
} from '@/services/playlistService';
import { uploadAudioFile, validateAudioFile } from '@/services/storage';
import { FlowerAccent } from '@/components/flowers/FlowerAccent';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import type { PlaylistSong } from '@/types';

export function Playlist() {
  const { user, couple } = useAuthStore();
  const { showToast } = useToastStore();

  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Dialogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<PlaylistSong | null>(null);
  const [songToDelete, setSongToDelete] = useState<PlaylistSong | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Active 3-dot menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form State
  const [addMode, setAddMode] = useState<'upload' | 'link'>('upload');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [note, setNote] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioFileError, setAudioFileError] = useState<string | null>(null);

  // Audio Playback State
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const coupleId = couple?.id || 'demo-couple';

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchPlaylistSongs(coupleId);
      setSongs(data);
      setIsLoading(false);
    }
    loadData();
  }, [coupleId]);

  // Audio Element Handlers
  const handleTogglePlay = (song: PlaylistSong) => {
    if (!song.audio_url && !song.link_url) {
      showToast('This track does not have playable audio attached.', 'info');
      return;
    }

    const playableUrl = song.audio_url || (song.link_url?.match(/\.(mp3|wav|m4a|ogg|aac)/i) ? song.link_url : null);

    if (!playableUrl) {
      if (song.link_url) {
        window.open(song.link_url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (currentPlayingId === song.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = playableUrl;
        audioRef.current.load();
        audioRef.current
          .play()
          .then(() => {
            setCurrentPlayingId(song.id);
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error('Audio playback failed:', err);
            showToast('Unable to stream this audio track', 'error');
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioFileError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setAudioFileError(validation.error || 'Invalid audio file');
      showToast(validation.error || 'Invalid audio file', 'error');
      return;
    }

    setSelectedAudioFile(file);

    // If title is empty, infer from file name
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
  };

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setLinkUrl('');
    setNote('');
    setSelectedAudioFile(null);
    setAudioFileError(null);
    setIsSubmitting(false);
    setUploadProgress(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (song: PlaylistSong) => {
    setTitle(song.title);
    setArtist(song.artist);
    setLinkUrl(song.link_url || '');
    setNote(song.note || '');
    setSelectedAudioFile(null);
    setAudioFileError(null);
    setEditingSong(song);
    setActiveMenuId(null);
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !user) return;

    setIsSubmitting(true);
    let storagePath: string | undefined = undefined;

    try {
      if (addMode === 'upload' && selectedAudioFile) {
        setUploadProgress('Uploading personal audio file...');
        const result = await uploadAudioFile(coupleId, selectedAudioFile);
        if (result) {
          storagePath = result.path;
        }
      }

      setUploadProgress('Saving to playlist...');
      const newSong = await addPlaylistSong({
        coupleId,
        addedById: user.id,
        title: title.trim(),
        artist: artist.trim(),
        linkUrl: linkUrl.trim() || undefined,
        storagePath,
        note: note.trim() || undefined,
      });

      if (newSong) {
        setSongs((prev) => [newSong, ...prev]);
        showToast('Song added to your sanctuary soundtrack 🎵', 'success');
      }

      resetForm();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to add song', 'error');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleUpdateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !title.trim() || !artist.trim()) return;

    setIsSubmitting(true);

    try {
      let storagePath = editingSong.storage_path || undefined;
      if (selectedAudioFile) {
        setUploadProgress('Uploading replacement audio...');
        const result = await uploadAudioFile(coupleId, selectedAudioFile);
        if (result) {
          storagePath = result.path;
        }
      }

      const updated = await updatePlaylistSong(
        editingSong.id,
        {
          title: title.trim(),
          artist: artist.trim(),
          linkUrl: linkUrl.trim() || undefined,
          storagePath,
          note: note.trim() || undefined,
        },
        coupleId
      );

      if (updated) {
        setSongs((prev) => prev.map((s) => (s.id === editingSong.id ? updated : s)));
        showToast('Song details updated ✨', 'success');
      }

      resetForm();
      setEditingSong(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update song', 'error');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!songToDelete) return;
    setIsDeleting(true);

    try {
      if (currentPlayingId === songToDelete.id) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setCurrentPlayingId(null);
      }

      const ok = await deletePlaylistSong(songToDelete.id, songToDelete.storage_path);
      if (ok) {
        setSongs((prev) => prev.filter((s) => s.id !== songToDelete.id));
        showToast('Song removed from playlist 🎵', 'success');
      } else {
        showToast('Could not delete song', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting song', 'error');
    } finally {
      setIsDeleting(false);
      setSongToDelete(null);
    }
  };

  const activePlayingSong = songs.find((s) => s.id === currentPlayingId);

  return (
    <PageContainer>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-[#B83B5E]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#E8C97A]/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10 relative z-10">
        <div>
          <p className="caption-gold text-xs flex items-center gap-1.5 mb-1 text-[#E8C97A]">
            <FlowerAccent variant="sakura" size={16} color="#F4B8C9" opacity={0.9} />
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
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-[#B83B5E]/30"
        >
          <Plus size={18} />
          <span>Add Song</span>
        </Button>
      </div>

      {/* Floating Mini Player when a song is active */}
      <AnimatePresence>
        {activePlayingSong && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="glass-card p-4 sm:p-5 rounded-2xl border border-[#F4B8C9]/30 bg-[#241B20]/95 backdrop-blur-xl mb-8 relative z-20 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => handleTogglePlay(activePlayingSong)}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-[#B83B5E] to-[#E8C97A] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#B83B5E]/30 hover:scale-105 transition-transform cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              <div className="min-w-0">
                <p
                  className="text-lg font-serif text-[#FFFCF9] truncate"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {activePlayingSong.title}
                </p>
                <p className="text-xs text-[#F4B8C9] font-sans truncate">{activePlayingSong.artist}</p>
              </div>
            </div>

            {/* Seek Bar & Controls */}
            <div className="flex-1 max-w-md mx-auto w-full flex flex-col gap-1.5 px-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#9C8490] font-sans w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 accent-[#F4B8C9] h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-[#9C8490] font-sans w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={toggleMute}
                className="text-[#9C8490] hover:text-[#F4B8C9] p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 accent-[#F4B8C9] h-1.5 bg-white/10 rounded-lg cursor-pointer"
                aria-label="Volume"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Grid */}
      <div className="relative z-10 flex-1 pb-12">
        {isLoading ? (
          <div className="py-20 text-center text-[#9C8490] font-sans">
            Loading soundtrack...
          </div>
        ) : songs.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 border border-[#F4B8C9]/20 rounded-3xl shadow-xl bg-gradient-to-b from-[#2E2028]/90 to-[#241B20]/95">
            <FlowerAccent variant="sakura" size={48} color="#F4B8C9" opacity={0.6} className="mx-auto mb-4" />
            <h3 className="text-2xl text-[#FFFCF9] font-serif mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Every love story needs a soundtrack. 🎵
            </h3>
            <p className="text-xs sm:text-sm text-[#9C8490] font-sans mb-6">
              Upload personal audio tracks or add Spotify/YouTube memory songs to listen together.
            </p>
            <Button variant="primary" onClick={openCreateModal}>
              + Add First Song 🎵
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song) => {
              const isCurrent = currentPlayingId === song.id;
              const hasAudio = !!song.audio_url || !!song.storage_path;
              const isMenuActive = activeMenuId === song.id;

              return (
                <motion.div
                  key={song.id}
                  whileHover={{ y: -4 }}
                  className={`glass-card p-6 sm:p-7 rounded-2xl border relative overflow-hidden flex flex-col justify-between transition-all bg-gradient-to-b from-[#2E2028]/85 to-[#241B20]/95 shadow-xl ${
                    isCurrent
                      ? 'border-[#F4B8C9]/60 shadow-lg shadow-[#B83B5E]/20'
                      : 'border-[#F4B8C9]/20 hover:border-[#F4B8C9]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(song)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                            isCurrent && isPlaying
                              ? 'bg-[#B83B5E] text-white shadow-lg shadow-[#B83B5E]/40'
                              : 'bg-[#F4B8C9]/10 border border-[#F4B8C9]/30 text-[#F4B8C9] hover:bg-[#F4B8C9]/20'
                          }`}
                          aria-label={isCurrent && isPlaying ? 'Pause' : 'Play song'}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause size={20} />
                          ) : (
                            <Play size={20} className="ml-0.5" />
                          )}
                        </button>

                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-[#E8C97A] font-sans flex items-center gap-1">
                            {hasAudio ? <FileAudio size={11} /> : <Radio size={11} />}
                            {hasAudio ? 'Personal Audio' : 'Streaming Link'}
                          </span>
                          <h3
                            className="text-xl font-serif text-[#FFFCF9] leading-snug line-clamp-1"
                            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                          >
                            {song.title}
                          </h3>
                          <p className="text-xs text-[#F4B8C9] font-sans truncate">{song.artist}</p>
                        </div>
                      </div>

                      {/* 3-dot options */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(isMenuActive ? null : song.id)}
                          className="p-1.5 rounded-full bg-white/5 text-[#9C8490] hover:text-white transition-colors cursor-pointer border border-white/10"
                          aria-label="Song options"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {isMenuActive && (
                          <div
                            className="absolute right-0 top-8 w-32 glass-card p-1.5 rounded-xl border border-white/10 bg-[#241B20]/95 shadow-2xl z-30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openEditModal(song)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#FFFCF9] hover:bg-white/10 transition-colors text-left"
                            >
                              <Edit3 size={13} className="text-[#F4B8C9]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setSongToDelete(song);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/15 transition-colors text-left"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {song.note && (
                      <p className="text-xs text-[#9C8490] font-sans italic leading-relaxed my-3 line-clamp-2">
                        "{song.note}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[11px] text-[#9C8490]">
                    {song.link_url ? (
                      <a
                        href={song.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E8C97A] hover:underline flex items-center gap-1 font-sans"
                      >
                        <ExternalLink size={12} />
                        <span>Open Link</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-[#9C8490]">Uploaded to sanctuary</span>
                    )}

                    <span className="text-[10px] text-[#9C8490]">
                      {new Date(song.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SONG MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <FlowerAccent variant="sakura" size={20} color="#F4B8C9" opacity={0.9} />
                  Add Song to Sanctuary
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mode switch */}
              <div className="flex rounded-xl bg-white/5 p-1 mb-4 border border-white/5">
                <button
                  type="button"
                  onClick={() => setAddMode('upload')}
                  className={`flex-1 py-2 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    addMode === 'upload'
                      ? 'bg-[#B83B5E] text-white shadow-md'
                      : 'text-[#9C8490] hover:text-white'
                  }`}
                >
                  <Upload size={13} />
                  <span>Upload Audio File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('link')}
                  className={`flex-1 py-2 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    addMode === 'link'
                      ? 'bg-[#B83B5E] text-white shadow-md'
                      : 'text-[#9C8490] hover:text-white'
                  }`}
                >
                  <ExternalLink size={13} />
                  <span>Streaming Link</span>
                </button>
              </div>

              <form onSubmit={handleAddSong} className="space-y-4">
                {addMode === 'upload' && (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-[#F4B8C9]/20">
                    <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A] flex items-center justify-between">
                      <span>Audio File (Private Storage)</span>
                      <span className="text-[10px] text-[#9C8490]">MP3, WAV, M4A, OGG (max 30MB)</span>
                    </label>

                    <input
                      type="file"
                      ref={audioInputRef}
                      onChange={handleAudioSelect}
                      accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/aac,audio/ogg"
                      className="hidden"
                    />

                    {selectedAudioFile ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4B8C9]/10 border border-[#F4B8C9]/30">
                        <div className="flex items-center gap-2 truncate">
                          <Music size={18} className="text-[#F4B8C9] shrink-0" />
                          <span className="text-xs font-sans text-[#FFFCF9] truncate font-medium">
                            {selectedAudioFile.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedAudioFile(null)}
                          className="text-[#9C8490] hover:text-red-400 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        className="py-6 rounded-xl border border-dashed border-[#F4B8C9]/40 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-[#F4B8C9] gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload size={22} />
                        <span className="text-xs font-sans font-medium">Choose audio file from device</span>
                      </button>
                    )}

                    {audioFileError && (
                      <p className="text-xs text-red-400 font-sans">{audioFileError}</p>
                    )}
                  </div>
                )}

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

                {addMode === 'link' && (
                  <Input
                    id="song-link"
                    label="Spotify / YouTube Link"
                    placeholder="https://open.spotify.com/track/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                    Memory Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/25 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9] placeholder-[#9C8490]/50"
                    placeholder="Why is this song special to both of you?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {uploadProgress && (
                  <p className="text-xs text-[#F4B8C9] font-sans animate-pulse pt-2">
                    {uploadProgress}
                  </p>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
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

      {/* EDIT SONG MODAL */}
      <AnimatePresence>
        {editingSong && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#F4B8C9]/30 bg-[#241B20]/95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl text-[#FFFCF9] font-serif flex items-center gap-2">
                  <Edit3 size={20} className="text-[#F4B8C9]" />
                  Edit Song Details
                </h2>
                <button
                  onClick={() => setEditingSong(null)}
                  disabled={isSubmitting}
                  className="text-[#9C8490] hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateSong} className="space-y-4">
                <Input
                  id="edit-song-title"
                  label="Song Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <Input
                  id="edit-song-artist"
                  label="Artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  required
                />

                <Input
                  id="edit-song-link"
                  label="Spotify / YouTube Link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase tracking-widest text-[#E8C97A]">
                    Memory Note
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#1A1015]/80 border border-[#F4B8C9]/25 rounded-xl p-3 text-[#FFFCF9] text-sm focus:outline-none focus:border-[#F4B8C9] placeholder-[#9C8490]/50"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {uploadProgress && (
                  <p className="text-xs text-[#F4B8C9] font-sans animate-pulse pt-2">
                    {uploadProgress}
                  </p>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <Button variant="ghost" type="button" onClick={() => setEditingSong(null)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Save Changes ✨
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!songToDelete}
        title="Remove this song?"
        message="This song and its attached audio file will be removed from your shared sanctuary playlist."
        confirmText="Remove Song"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setSongToDelete(null)}
      />
    </PageContainer>
  );
}
