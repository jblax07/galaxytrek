'use client';

import { useState, useEffect } from 'react';
import { getVoteCounts, updateVoteCount } from '@/lib/db/supabase';
import { TimeVote, TimeSlotWithVotes } from '@/lib/db/types';
import { cn } from '@/lib/utils';

interface EventTimePollProps {
  availableTimes: string[];
  eventTitle: string;
}

export function EventTimePoll({
  availableTimes,
  eventTitle,
}: EventTimePollProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [voteCounts, setVoteCounts] = useState<TimeVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVoteCounts();
  }, []);

  const loadVoteCounts = async () => {
    setIsLoading(true);
    const counts = await getVoteCounts();
    setVoteCounts(counts);
    setIsLoading(false);
  };

  // Generate time slots in UTC
  const generateTimeSlots = () => {
    const slots: TimeSlotWithVotes[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Create time slots from 0100 to 2400
    for (let hour = 1; hour <= 24; hour++) {
      const formattedHour = `${hour.toString().padStart(2, '0')}00`;

      days.forEach((day) => {
        // Find vote count for this slot
        const voteData = voteCounts.find(
          (v) => v.day === day && v.hour === hour
        );

        slots.push({
          day,
          time: formattedHour,
          utcTime: `${hour.toString().padStart(2, '0')}:00`,
          hour,
          voteCount: voteData?.vote_count || 0,
          selected: false,
        });
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Group slots by unique times and sort by hour
  const uniqueTimeSlots = Array.from(
    new Map(timeSlots.map((slot) => [slot.hour, slot])).values()
  ).sort((a, b) => a.hour - b.hour);

  const handleSlotClick = async (
    day: string,
    utcTime: string,
    hour: number
  ) => {
    const slotId = `${day}-${utcTime}`;
    const isSelected = selectedSlots.has(slotId);

    try {
      await updateVoteCount(day, hour, !isSelected);
      await loadVoteCounts(); // Refresh vote counts

      setSelectedSlots((prev) => {
        const newSet = new Set(prev);
        if (isSelected) {
          newSet.delete(slotId);
        } else {
          newSet.add(slotId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error updating vote:', error);
    }
  };

  // Calculate the maximum vote count for intensity scaling
  const maxVotes = Math.max(...voteCounts.map((v) => v.vote_count), 1);

  // Function to get background color based on vote count
  const getBackgroundColor = (voteCount: number, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-500 hover:bg-blue-600';
    }

    if (voteCount === 0) {
      return 'hover:bg-gray-100';
    }

    const intensity = (voteCount / maxVotes) * 100;
    return cn(
      'hover:bg-blue-100',
      intensity <= 20 && 'bg-blue-50',
      intensity > 20 && intensity <= 40 && 'bg-blue-100',
      intensity > 40 && intensity <= 60 && 'bg-blue-200',
      intensity > 60 && intensity <= 80 && 'bg-blue-300',
      intensity > 80 && 'bg-blue-400'
    );
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>Loading...</div>
    );
  }

  return (
    <div className='w-full max-w-2xl mx-auto bg-white rounded-lg'>
      <div className='mb-4'>
        <h2 className='text-lg font-semibold text-gray-800'>
          Select Your Available Times
        </h2>
        <p className='text-xs text-gray-500 mt-1'>
          Times shown in your local timezone (
          {Intl.DateTimeFormat().resolvedOptions().timeZone})
        </p>
      </div>

      <div className='relative'>
        {/* Fixed header */}
        <div className='sticky top-0 z-20 bg-white'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='w-16 h-8 px-3 text-right bg-gray-50 text-xs font-medium text-gray-500 sticky left-0 z-30'></th>
                {days.map((day) => (
                  <th
                    key={day}
                    className='w-14 h-8 text-center font-medium text-gray-500 bg-gray-50 text-xs tracking-wider'
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div className='overflow-y-auto'>
          <table className='w-full border-collapse bg-white'>
            <tbody className='divide-y divide-gray-100'>
              {uniqueTimeSlots.map((timeSlot) => (
                <tr
                  key={`row-${timeSlot.hour}`}
                  className='hover:bg-gray-50/50'
                >
                  <td className='w-16 h-8 px-3 text-xs font-medium text-gray-500 bg-gray-50/50 sticky left-0 border-r border-gray-100 text-right'>
                    {timeSlot.time}
                  </td>
                  {days.map((day) => {
                    const slot = timeSlots.find(
                      (s) => s.day === day && s.hour === timeSlot.hour
                    );
                    if (!slot) return null;

                    const slotId = `${day}-${slot.utcTime}`;
                    const isSelected = selectedSlots.has(slotId);

                    return (
                      <td
                        key={slotId}
                        onClick={() =>
                          handleSlotClick(day, slot.utcTime, slot.hour)
                        }
                        className={`w-14 h-8 text-center cursor-pointer transition-colors ${getBackgroundColor(
                          slot.voteCount,
                          isSelected
                        )}`}
                        title={`${day} ${timeSlot.time} (${slot.voteCount} votes)`}
                      >
                        <div className='w-full h-full flex items-center justify-center'>
                          {isSelected ? (
                            <span className='text-white'>✓</span>
                          ) : slot.voteCount > 0 ? (
                            <span className='text-gray-600 text-xs'>
                              {slot.voteCount}
                            </span>
                          ) : (
                            <span className='text-transparent'>·</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
