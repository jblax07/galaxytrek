'use client';

import { useState, useEffect } from 'react';

interface BackupYouTubeEmbedProps {
  videoId: string;
  opacity?: number;
}

const BackupYouTubeEmbed = ({
  videoId,
  opacity = 0.4,
}: BackupYouTubeEmbedProps) => {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Add a class to the body to help with debugging
    document.body.classList.add('youtube-background-added');

    return () => {
      document.body.classList.remove('youtube-background-added');
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className='fixed inset-0 pointer-events-none overflow-hidden'
      style={{
        opacity: loaded ? opacity : 0,
        transition: 'opacity 1s ease-in-out',
      }}
    >
      {/* Dark overlay to help video stand out */}
      <div className='absolute inset-0 bg-black opacity-80'></div>

      {/* YouTube iframe container */}
      <div className='absolute inset-0'>
        <iframe
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%]'
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${videoId}&version=3&playsinline=1`}
          title='YouTube video player'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
          onLoad={() => {
            console.log('YouTube backup iframe loaded');
            // Add a delay to ensure the video has started playing
            setTimeout(() => setLoaded(true), 1000);
          }}
        ></iframe>
      </div>

      {/* Debug info */}
      <div className='fixed bottom-2 left-2 bg-black/80 text-white text-xs p-1 z-50'>
        YouTube Player: {videoId} {loaded ? '(loaded)' : '(loading...)'}
      </div>
    </div>
  );
};

export default BackupYouTubeEmbed;
