'use client';

import { useState, useEffect, useRef } from 'react';

interface DirectYouTubeBackgroundProps {
  videoId: string;
}

const DirectYouTubeBackground = ({ videoId }: DirectYouTubeBackgroundProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mounting and window resize
  useEffect(() => {
    setIsMounted(true);

    // Update viewport size on mount and resize
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial size
    updateViewportSize();

    // Add resize listener
    window.addEventListener('resize', updateViewportSize);

    // Clean up
    return () => {
      window.removeEventListener('resize', updateViewportSize);
    };
  }, []);

  // Calculate video dimensions based on viewport size
  const getVideoDimensions = () => {
    const { width, height } = viewportSize;
    const isPortrait = height > width;

    // For portrait orientations (mobile), make video wider
    if (isPortrait) {
      return {
        width: Math.max(width * 2.5, height * 2.5 * (16 / 9)), // Ensure video is significantly wider on mobile
        height: Math.max(height * 1.5, width * 1.5 * (9 / 16)),
      };
    }

    // For landscape (desktop), ensure video covers the entire viewport
    return {
      width: Math.max(width * 1.5, height * 1.5 * (16 / 9)),
      height: Math.max(height * 1.5, width * 1.5 * (9 / 16)),
    };
  };

  if (!isMounted) return null;

  const videoDimensions = getVideoDimensions();

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 overflow-hidden h-screen w-screen'
      style={{ zIndex: 10, pointerEvents: 'none' }}
    >
      {/* Semi-transparent overlay */}
      <div className='absolute inset-0 bg-black bg-opacity-50'></div>

      {/* Video container - set to fill screen */}
      <div className='absolute inset-0 h-full w-full overflow-hidden'>
        <iframe
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          style={{
            width: `${videoDimensions.width}px`,
            height: `${videoDimensions.height}px`,
            opacity: 0.7,
          }}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&loop=1&playlist=${videoId}&modestbranding=1&playsinline=1&enablejsapi=1`}
          title='YouTube video player'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
        />
      </div>

      {/* Debug info - Removing visibility completely */}
      {false && (
        <div className='fixed bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs p-1 z-50'>
          YouTube: {videoId} | {viewportSize.width}x{viewportSize.height} |{' '}
          {viewportSize.height > viewportSize.width ? 'Portrait' : 'Landscape'}
        </div>
      )}
    </div>
  );
};

export default DirectYouTubeBackground;
