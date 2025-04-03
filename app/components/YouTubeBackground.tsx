'use client';

import { useState, useEffect, useRef } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
  startTime?: number;
  opacity?: number;
  quality?: 'default' | 'hd720' | 'hd1080';
}

const YouTubeBackground = ({
  videoId,
  startTime = 0,
  opacity = 0.3,
  quality = 'hd1080',
}: YouTubeBackgroundProps) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 1920, // Default fallback values
    height: 1080,
  });
  const [isBrowser, setIsBrowser] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  // Check if code is running in browser
  useEffect(() => {
    setIsBrowser(true);

    // Set initial size once we're in the browser
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Set up window resize listener
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate dimensions to cover the entire viewport while maintaining aspect ratio
  const calculateDimensions = () => {
    const { width, height } = windowSize;
    const aspectRatio = 16 / 9; // YouTube's aspect ratio

    let videoWidth, videoHeight;

    if (width / height > aspectRatio) {
      // Window is wider than video aspect ratio
      videoWidth = width;
      videoHeight = width / aspectRatio;
    } else {
      // Window is taller than video aspect ratio
      videoHeight = height;
      videoWidth = height * aspectRatio;
    }

    // Make the video slightly larger to ensure it covers the entire screen
    return {
      width: videoWidth * 1.1,
      height: videoHeight * 1.1,
    };
  };

  const dimensions = calculateDimensions();

  // Don't render anything during SSR
  if (!isBrowser) {
    return null;
  }

  // Build the YouTube embed URL safely (only in browser)
  const getYouTubeEmbedUrl = () => {
    // Updated params for better compatibility and performance
    const baseUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${videoId}&start=${startTime}&vq=${quality}`;

    // Only add origin parameter in the browser
    if (typeof window !== 'undefined') {
      return `${baseUrl}&origin=${encodeURIComponent(window.location.origin)}`;
    }

    return baseUrl;
  };

  return (
    <div className='fixed inset-0 pointer-events-none overflow-hidden'>
      {/* Video Container */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          iframeLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          opacity,
          background: 'black',
        }}
      >
        {/* Debug info to check if iframe is loading */}
        {!iframeLoaded && (
          <div className='absolute top-0 left-0 bg-black/80 text-white text-xs p-1 z-50'>
            Loading YouTube video...
          </div>
        )}

        <iframe
          ref={playerRef}
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          width={dimensions.width}
          height={dimensions.height}
          src={getYouTubeEmbedUrl()}
          title='YouTube background video'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
          onLoad={() => {
            console.log('YouTube iframe loaded');
            setIframeLoaded(true);
          }}
        />
      </div>
    </div>
  );
};

export default YouTubeBackground;
