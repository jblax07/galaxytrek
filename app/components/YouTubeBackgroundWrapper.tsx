'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';

// Import the YouTubeBackground component with SSR disabled
const YouTubeBackground = dynamic(() => import('./YouTubeBackground'), {
  ssr: false,
  loading: () => <YouTubeLoadingIndicator />,
});

function YouTubeLoadingIndicator() {
  return (
    <div className='fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded z-50'>
      Loading YouTube background...
    </div>
  );
}

interface YouTubeBackgroundWrapperProps {
  videoId: string;
  startTime?: number;
  opacity?: number;
  quality?: 'default' | 'hd720' | 'hd1080';
}

const YouTubeBackgroundWrapper = (props: YouTubeBackgroundWrapperProps) => {
  const [mounted, setMounted] = useState(false);

  // Only show on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<YouTubeLoadingIndicator />}>
      <div className='video-debug-info fixed bottom-2 right-2 bg-black/80 text-white text-xs p-1 z-50'>
        Video ID: {props.videoId}
      </div>
      <YouTubeBackground {...props} />
    </Suspense>
  );
};

export default YouTubeBackgroundWrapper;
