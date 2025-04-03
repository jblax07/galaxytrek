'use client';

import { useState, useEffect } from 'react';
import { getVoteCounts, updateVoteCount } from '@/lib/db/supabase';
import { TimeVote, TimeSlotWithVotes } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
  const [timezone, setTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  useEffect(() => {
    loadVoteCounts();
  }, []);

  const loadVoteCounts = async () => {
    setIsLoading(true);
    const counts = await getVoteCounts();
    setVoteCounts(counts);
    setIsLoading(false);
  };

  // Function to convert local time to UTC
  const localToUTC = (
    localHour: number
  ): { utcHour: number; utcDay: number } => {
    // Create a date object for today at the specified local hour
    const today = new Date();
    const localDate = new Date(today);
    localDate.setHours(localHour, 0, 0, 0);

    // Get the timezone offset in hours (minutes ÷ 60)
    const offsetInHours = localDate.getTimezoneOffset() / 60;

    // Calculate UTC hour (add offset since getTimezoneOffset returns negative for east)
    let utcHour = (localHour + offsetInHours) % 24;
    if (utcHour < 0) utcHour += 24;

    // Determine if we crossed a day boundary
    let utcDay = localDate.getDay();
    if (localHour + offsetInHours < 0) {
      // We went back a day
      utcDay = (utcDay - 1 + 7) % 7;
    } else if (localHour + offsetInHours >= 24) {
      // We went forward a day
      utcDay = (utcDay + 1) % 7;
    }

    return { utcHour, utcDay };
  };

  // Function to convert UTC time to local
  const UTCToLocal = (
    utcHour: number,
    utcDay: number
  ): { localHour: number; localDay: number } => {
    // Create a date object for UTC time
    const today = new Date();
    const utcDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
        utcHour
      )
    );

    // Convert to local time
    const localDate = new Date(utcDate);

    // Extract local hour and day
    const localHour = localDate.getHours();
    const localDay = localDate.getDay();

    return { localHour, localDay };
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots: TimeSlotWithVotes[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayIndexMap: Record<string, number> = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 0,
    };

    // Create time slots from 0100 to 2400
    for (let hour = 1; hour <= 24; hour++) {
      const formattedHour = `${hour.toString().padStart(2, '0')}00`;

      days.forEach((day) => {
        // Convert local display time to UTC for finding votes
        const dayIndex = dayIndexMap[day];
        const today = new Date();
        today.setDate(today.getDate() + ((dayIndex - today.getDay() + 7) % 7));

        // Create a date for this local time
        const localDate = new Date(today);
        const actualHour = hour === 24 ? 0 : hour;
        localDate.setHours(actualHour, 0, 0, 0);

        // Get timezone offset and calculate UTC
        const offsetInHours = localDate.getTimezoneOffset() / 60;
        let utcHour = (actualHour + offsetInHours) % 24;
        if (utcHour < 0) utcHour += 24;

        // Determine if we crossed a day boundary
        let utcDayIndex = dayIndex;
        if (actualHour + offsetInHours < 0) {
          // We went back a day
          utcDayIndex = (utcDayIndex - 1 + 7) % 7;
        } else if (actualHour + offsetInHours >= 24) {
          // We went forward a day
          utcDayIndex = (utcDayIndex + 1) % 7;
        }
        const utcDay = days[utcDayIndex === 0 ? 6 : utcDayIndex - 1];

        // Find vote count for this UTC slot
        const voteData = voteCounts.find(
          (v) => v.day === utcDay && v.hour === utcHour
        );

        // For debugging
        console.log(
          `Local ${day} ${formattedHour} → UTC ${utcDay} ${utcHour
            .toString()
            .padStart(2, '0')}:00`
        );

        slots.push({
          day,
          time: formattedHour,
          utcTime: `${utcHour.toString().padStart(2, '0')}:00`,
          utcDay,
          hour: actualHour,
          utcHour,
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
    utcDay: string,
    utcHour: number
  ) => {
    const slotId = `${day}-${utcTime}`;
    const isSelected = selectedSlots.has(slotId);

    try {
      await updateVoteCount(utcDay, utcHour, !isSelected);
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
          Times shown in your local timezone ({timezone})
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
                          handleSlotClick(
                            day,
                            slot.utcTime,
                            slot.utcDay,
                            slot.utcHour
                          )
                        }
                        className={`w-14 h-8 text-center cursor-pointer transition-colors ${getBackgroundColor(
                          slot.voteCount,
                          isSelected
                        )}`}
                        title={`${day} ${timeSlot.time} → UTC ${slot.utcDay} ${slot.utcTime} (${slot.voteCount} votes)`}
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
