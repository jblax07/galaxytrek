import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerTrigger } from '@/components/ui/drawer';
import { EventTimeDrawer } from './components/EventTimeDrawer';
import HyperdriveWrapper from './components/HyperdriveWrapper';
import MusicPlayer from './components/MusicPlayer';
import DirectYouTubeBackground from './components/DirectYouTubeBackground';

// Define playlist
const spacePlaylist = [
  {
    src: '/music/imperium-ryan-taubert-musicbed.mp3',
    title: 'Imperium - Ryan Taubert',
  },
  {
    src: '/music/marvel-ryan-taubert-musicbed.mp3',
    title: 'Marvel - Ryan Taubert',
  },
  {
    src: '/music/starfall-ryan-taubert-musicbed.mp3',
    title: 'Starfall - Ryan Taubert',
  },
  {
    src: '/music/verve-feat-fjora-ryan-taubert-musicbed.mp3',
    title: 'Verve feat Fjora - Ryan Taubert',
  },
];

// YouTube video ID
const YOUTUBE_VIDEO_ID = 'nmXgZg-obao';

export default function Home() {
  return (
    <main className='min-h-screen bg-black overflow-hidden relative'>
      {/* Layer 1: Hyperdrive background */}
      <div
        className='absolute inset-0'
        style={{ zIndex: 5 }}
      >
        <HyperdriveWrapper
          starCount={200}
          speed={1.5}
          distantStarCount={100}
        />
      </div>

      {/* Layer 2: Simple Direct YouTube Background - should definitely be visible */}
      <DirectYouTubeBackground videoId={YOUTUBE_VIDEO_ID} />

      {/* Hero Section */}
      <div
        className='w-full flex flex-col items-center justify-center min-h-screen relative'
        style={{ zIndex: 20 }}
      >
        {/* Logo and Controls in a compact centered arrangement */}
        <div className='flex flex-col items-center justify-center -mt-10'>
          {/* Logo Container */}
          <div className='w-full max-w-[800px] logo-container -mb-10 -mt-10'>
            <Image
              src='/images/logo.png'
              alt='Galaxy Trek Logo'
              width={1000}
              height={1000}
              style={{ opacity: 0.85 }}
              className='w-full h-auto object-contain'
              priority
            />
          </div>

          {/* Controls Container - Directly below logo, minimal spacing */}
          <div className='flex flex-col sm:flex-row gap-6 items-center relative z-50 -mt-10'>
            {/* Drawer with EventTimePoll */}
            <Drawer shouldScaleBackground={true}>
              <DrawerTrigger asChild>
                <Button
                  variant='outline'
                  className='bg-white text-black hover:bg-gray-100 min-w-[150px]'
                >
                  Vote Event Times
                </Button>
              </DrawerTrigger>
              <EventTimeDrawer />
            </Drawer>

            {/* Music Player with Playlist */}
            <MusicPlayer playlist={spacePlaylist} />
          </div>
        </div>

        {/* Horizontal lines effect */}
        <div className='absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden'>
          {/* Horizontal lines effect */}
          <div className='absolute w-full h-full bg-[linear-gradient(0deg,transparent_50%,rgba(255,255,255,0.1)_50%)] bg-[length:100%_4px]'></div>
        </div>
      </div>
    </main>
  );
}
