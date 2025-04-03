'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
  SkipForward,
  SkipBack,
  ListMusic,
} from 'lucide-react';

interface Song {
  src: string;
  title: string;
}

interface MusicPlayerProps {
  playlist?: Song[];
  audioSrc?: string;
  audioTitle?: string;
}

const MusicPlayer = ({
  playlist = [],
  audioSrc,
  audioTitle = 'Galaxy Trek Theme',
}: MusicPlayerProps) => {
  // If a playlist is provided, use it. Otherwise, create a single-item playlist
  const [songs] = useState<Song[]>(() => {
    if (playlist.length > 0) return playlist;
    if (audioSrc) return [{ src: audioSrc, title: audioTitle }];
    return [
      {
        src: '/imperium-ryan-taubert-musicbed.mp3',
        title: 'Imperium - Ryan Taubert',
      },
    ];
  });

  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentSongIndex < songs.length - 1) {
        // Play next song
        setCurrentSongIndex((idx) => idx + 1);
      } else {
        // End of playlist
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    // Set initial volume
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSongIndex, songs.length]);

  // When changing songs, play the new song if already playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
  }, [currentSongIndex, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume === 0) {
        audioRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;

    if (audioRef.current && !isNaN(duration)) {
      const newTime = clickPosition * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const playNextSong = () => {
    if (currentSongIndex < songs.length - 1) {
      setCurrentSongIndex((idx) => idx + 1);
    } else {
      // Loop back to first song
      setCurrentSongIndex(0);
    }
  };

  const playPreviousSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex((idx) => idx - 1);
    } else {
      // Loop to last song
      setCurrentSongIndex(songs.length - 1);
    }
  };

  const selectSong = (index: number) => {
    setCurrentSongIndex(index);
    setShowPlaylist(false);
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    }
  };

  // Format time in mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get volume icon based on level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={16} />;
    if (volume < 0.3) return <Volume size={16} />;
    if (volume < 0.7) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Only show controls if we have a playlist with multiple songs
  const hasMultipleSongs = songs.length > 1;

  return (
    <div className='relative flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 h-10 rounded-md border border-white/20'>
      <audio
        ref={audioRef}
        src={currentSong.src}
        onEnded={() => {
          if (currentSongIndex < songs.length - 1) {
            playNextSong();
          } else {
            setIsPlaying(false);
          }
        }}
      />

      {/* Previous/Play/Next controls - Always visible */}
      <div className='flex items-center gap-1'>
        {hasMultipleSongs && (
          <Button
            variant='ghost'
            size='icon'
            onClick={playPreviousSong}
            className='h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white p-0 flex-shrink-0'
            title='Previous Song'
          >
            <SkipBack size={14} />
          </Button>
        )}

        <Button
          variant='ghost'
          size='icon'
          onClick={togglePlay}
          className='h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white p-0 flex-shrink-0'
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </Button>

        {hasMultipleSongs && (
          <Button
            variant='ghost'
            size='icon'
            onClick={playNextSong}
            className='h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white p-0 flex-shrink-0'
            title='Next Song'
          >
            <SkipForward size={14} />
          </Button>
        )}
      </div>

      {/* Song title and playlist button */}
      <div className='flex items-center gap-1'>
        {/* Current song title */}
        <span
          className='text-xs text-white/90 truncate max-w-[80px] sm:max-w-[120px]'
          title={currentSong.title}
        >
          {currentSong.title}
        </span>

        {/* Playlist button - only shown if we have multiple songs */}
        {hasMultipleSongs && (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setShowPlaylist(!showPlaylist)}
            className='h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white p-0 flex-shrink-0'
            title='Playlist'
          >
            <ListMusic size={14} />
          </Button>
        )}
      </div>

      {/* Progress bar with time display */}
      <div className='flex-1 flex items-center gap-1 px-1'>
        <span className='text-xs text-white/70 min-w-[28px] text-center'>
          {formatTime(currentTime)}
        </span>

        {/* Custom progress bar */}
        <div
          className='flex-1 h-1.5 bg-white/20 rounded cursor-pointer relative group'
          onClick={handleProgressClick}
        >
          <div
            className='absolute top-0 left-0 h-full bg-white/70 rounded'
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className='absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
            style={{
              left: `${progressPercentage}%`,
              transform: `translate(-50%, -50%)`,
            }}
          />
        </div>

        <span className='text-xs text-white/70 min-w-[28px] text-center'>
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume control */}
      <div className='relative flex-shrink-0'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleMute}
          onMouseEnter={() => setShowVolumeSlider(true)}
          className='h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white p-0'
          title='Volume'
        >
          {getVolumeIcon()}
        </Button>

        {showVolumeSlider && (
          <div
            className='absolute bottom-full mb-2 bg-black/90 p-2 rounded-md border border-white/20 w-28 z-50'
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={volume}
              onChange={handleVolumeChange}
              className='w-full h-1 accent-white cursor-pointer'
            />
          </div>
        )}
      </div>

      {/* Playlist dropdown */}
      {showPlaylist && hasMultipleSongs && (
        <div className='absolute top-full mt-2 left-0 bg-black/90 p-2 rounded-md border border-white/20 w-64 max-h-60 overflow-y-auto z-50'>
          <h3 className='text-xs font-semibold text-white mb-2'>
            Playlist ({songs.length} songs)
          </h3>
          <ul className='space-y-1'>
            {songs.map((song, idx) => (
              <li
                key={idx}
                className={`text-xs p-2 cursor-pointer rounded hover:bg-white/10 flex items-center gap-2 ${
                  currentSongIndex === idx ? 'bg-white/20' : ''
                }`}
                onClick={() => selectSong(idx)}
                title={song.title}
              >
                <span className='w-4 text-center'>
                  {currentSongIndex === idx ? '►' : idx + 1}
                </span>
                <span className='flex-1 truncate'>{song.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
