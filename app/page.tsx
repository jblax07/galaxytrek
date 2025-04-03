import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerTrigger } from '@/components/ui/drawer';
import { EventTimeDrawer } from './components/EventTimeDrawer';

export default function Home() {
  return (
    <main className='min-h-screen bg-black overflow-hidden relative'>
      {/* Hyperspace background */}
      <div className='fixed inset-0 overflow-hidden'>
        <div className='stars'></div>
        <div
          className='stars'
          style={{ animationDelay: '-0.15s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-0.3s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-0.45s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-0.6s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-0.75s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-0.9s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-1.05s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-1.2s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-1.35s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-1.5s' }}
        ></div>
        <div
          className='stars'
          style={{ animationDelay: '-1.65s' }}
        ></div>
      </div>

      {/* Hero Section */}
      <div className='w-full flex flex-col items-center justify-center min-h-screen relative z-10'>
        {/* Logo Container with hover effect */}
        <div className='w-full max-w-[500px] mb-8 logo-container'>
          <Image
            src='/images/logo.png'
            alt='Galaxy Trek Logo'
            width={800}
            height={800}
            className='w-full h-auto object-contain invert'
            priority
          />
        </div>

        {/* Drawer with EventTimePoll */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant='outline'
              className='bg-white text-black hover:bg-gray-100'
            >
              Vote Event Times
            </Button>
          </DrawerTrigger>
          <EventTimeDrawer />
        </Drawer>

        {/* Animated background elements */}
        <div className='absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden'>
          <div className='stars absolute w-full h-full opacity-50'></div>
          {/* Horizontal lines effect */}
          <div className='absolute w-full h-full bg-[linear-gradient(0deg,transparent_50%,rgba(255,255,255,0.1)_50%)] bg-[length:100%_4px]'></div>
        </div>
      </div>
    </main>
  );
}
