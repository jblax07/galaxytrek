'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventTimePoll } from './EventTimePoll';
import { updateVoteCount } from '@/lib/db/supabase';
import { toast } from 'sonner';

export function EventTimeDrawer() {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<
    Array<{ day: string; hour: number }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectionChange = (
    selections: Array<{ day: string; hour: number }>
  ) => {
    setSelectedTimeSlots(selections);
  };

  const handleSubmit = async () => {
    if (selectedTimeSlots.length === 0) {
      toast.error('Please select at least one available time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit all selected time slots at once
      await Promise.all(
        selectedTimeSlots.map(({ day, hour }) =>
          updateVoteCount(day, hour, true)
        )
      );

      toast.success(
        `Successfully submitted ${selectedTimeSlots.length} time preferences.`
      );

      // Refresh the page to show updated vote counts
      window.location.reload();
    } catch (error) {
      console.error('Error submitting preferences:', error);
      toast.error(
        'There was an error submitting your preferences. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DrawerContent className='bg-white h-[90vh] flex flex-col'>
      <DrawerHeader className='px-4 py-2 flex-none'>
        <DrawerTitle>Select Available Times</DrawerTitle>
      </DrawerHeader>
      <div className='flex-1 min-h-0'>
        <ScrollArea className='h-full'>
          <div className='px-4 pb-4'>
            <EventTimePoll
              availableTimes={['10:00 AM', '12:00 PM', '2:00 PM']}
              eventTitle='Galaxy Trek Launch Event'
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </ScrollArea>
      </div>
      <DrawerFooter className='flex-none px-4 py-4 border-t'>
        <div className='w-full max-w-2xl mx-auto'>
          <Button
            className='w-full bg-black text-white hover:bg-gray-900'
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Submitting...'
              : `Submit ${selectedTimeSlots.length || 'No'} Preferences`}
          </Button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
