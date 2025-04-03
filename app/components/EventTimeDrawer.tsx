'use client';

import { Button } from '@/components/ui/button';
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventTimePoll } from './EventTimePoll';

export function EventTimeDrawer() {
  const handleSubmit = () => {
    // TODO: Implement submit functionality
    console.log('Submitting preferences');
  };

  return (
    <DrawerContent className='bg-white h-[90vh] flex flex-col'>
      <DrawerHeader className='px-4 py-2 flex-none'>
        <DrawerTitle></DrawerTitle>
      </DrawerHeader>
      <div className='flex-1 min-h-0'>
        <ScrollArea className='h-full'>
          <div className='px-4 pb-4'>
            <EventTimePoll
              availableTimes={['10:00 AM', '12:00 PM', '2:00 PM']}
              eventTitle='Galaxy Trek Launch Event'
            />
          </div>
        </ScrollArea>
      </div>
      <DrawerFooter className='flex-none px-4 py-4 border-t'>
        <div className='w-full max-w-2xl mx-auto'>
          <Button
            className='w-full bg-black text-white hover:bg-gray-900'
            onClick={handleSubmit}
          >
            Submit Preferences
          </Button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
