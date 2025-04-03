'use client';

import { useState, useEffect } from 'react';
import {
  format,
  addHours,
  startOfDay,
  endOfDay,
  parseISO,
  getDay,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TimeVote {
  id: string;
  day: string;
  hour: number;
  vote_count: number;
}

interface TimeSlot {
  day: string;
  hour: number;
  date: Date;
  localTime: Date;
  utcTime: Date;
  votes: number;
  selected: boolean;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function TimeZoneScheduler() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeZone, setTimeZone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch existing votes from the database
  const fetchVotes = async () => {
    try {
      console.log('Fetching votes from API');
      const response = await fetch('/api/time-votes');
      if (!response.ok) throw new Error('Failed to fetch votes');
      const data = (await response.json()) as TimeVote[];
      console.log('Received votes data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching votes:', error);
      toast.error('Failed to load existing votes');
      return [];
    }
  };

  // Generate time slots for the selected date
  useEffect(() => {
    if (!date) return;

    const loadTimeSlots = async () => {
      setLoading(true);
      try {
        const votes = await fetchVotes();
        const slots: TimeSlot[] = [];
        const start = startOfDay(date);

        // Get the day name from the selected date
        const dayName = DAYS_OF_WEEK[getDay(date)];

        // Generate slots for every hour of the day
        for (let hour = 0; hour < 24; hour++) {
          // Create date object for this hour in local timezone
          const localDate = addHours(start, hour);

          // Calculate UTC hour using the timezone offset
          const offsetInHours = localDate.getTimezoneOffset() / 60;
          let utcHour = (hour + offsetInHours) % 24;
          if (utcHour < 0) utcHour += 24;

          // Create UTC date object
          const utcDate = new Date(localDate);
          // Handle day boundary crossing
          if (hour + offsetInHours < 0) {
            utcDate.setDate(utcDate.getDate() - 1);
          } else if (hour + offsetInHours >= 24) {
            utcDate.setDate(utcDate.getDate() + 1);
          }
          utcDate.setHours(utcHour, 0, 0, 0);

          // Get the day in UTC
          const utcDay = DAYS_OF_WEEK[utcDate.getDay()];

          console.log(`Hour ${hour} local -> UTC hour ${utcHour} on ${utcDay}`);

          // Find if there are any votes for this UTC day and hour
          const voteData = votes.find(
            (v) => v.day === utcDay && v.hour === utcHour
          );

          if (voteData) {
            console.log(
              `Found vote for ${utcDay} at UTC hour ${utcHour}:`,
              voteData
            );
          }

          const slotKey = `${dayName}-${hour}`;

          slots.push({
            day: dayName,
            hour,
            date: localDate,
            localTime: localDate,
            utcTime: utcDate,
            votes: voteData?.vote_count || 0,
            selected: selectedSlots.has(slotKey),
          });
        }

        setTimeSlots(slots);
      } catch (error) {
        console.error('Error loading time slots:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeSlots();
  }, [date, timeZone, selectedSlots]);

  const toggleTimeSlot = (slot: TimeSlot) => {
    const slotKey = `${slot.day}-${slot.hour}`;
    const newSelectedSlots = new Set(selectedSlots);

    if (selectedSlots.has(slotKey)) {
      newSelectedSlots.delete(slotKey);
    } else {
      newSelectedSlots.add(slotKey);
    }

    setSelectedSlots(newSelectedSlots);
  };

  const submitVotes = async () => {
    setLoading(true);
    try {
      const votesToSubmit = Array.from(selectedSlots).map((slotKey) => {
        const [day, hourStr] = slotKey.split('-');
        const localHour = parseInt(hourStr);

        // Create a date object for this slot in the user's timezone
        const selectedDate = date || new Date();
        const localDate = new Date(selectedDate);
        localDate.setHours(localHour, 0, 0, 0);

        // Get timezone offset in hours (positive for west of UTC, negative for east)
        const offsetInHours = localDate.getTimezoneOffset() / 60;

        // Calculate UTC hour mathematically (add offset since getTimezoneOffset is inverted)
        // Note: This handles day boundary crossing automatically
        let utcHour = (localHour + offsetInHours) % 24;
        if (utcHour < 0) utcHour += 24; // Handle negative hours

        // Calculate the proper UTC date
        const utcDate = new Date(localDate);
        // Adjust date if crossing day boundary
        if (localHour + offsetInHours < 0) {
          // If local + offset is negative, we went back a day
          utcDate.setDate(utcDate.getDate() - 1);
        } else if (localHour + offsetInHours >= 24) {
          // If local + offset >= 24, we went forward a day
          utcDate.setDate(utcDate.getDate() + 1);
        }
        utcDate.setHours(utcHour, 0, 0, 0);

        // Get the day in UTC
        const utcDay = DAYS_OF_WEEK[utcDate.getDay()];

        console.log('Converting local to UTC:', {
          localDay: day,
          localDate: localDate.toString(),
          localHour: localHour,
          offsetInHours: offsetInHours,
          utcDay: utcDay,
          utcDate: utcDate.toString(),
          utcHour: utcHour,
          mathCalculation: `${localHour} + ${offsetInHours} = ${
            localHour + offsetInHours
          } % 24 = ${utcHour}`,
        });

        return {
          day: utcDay, // Use the UTC day
          hour: utcHour, // Store the UTC hour
          utc_hour: utcHour,
          utc_time: utcDate.toISOString(),
          local_day: day,
          local_hour: localHour,
        };
      });

      console.log('Submitting votes:', votesToSubmit);

      const response = await fetch('/api/time-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votes: votesToSubmit }),
      });

      if (!response.ok) throw new Error('Failed to submit votes');

      toast.success('Your availability has been recorded');
      setSelectedSlots(new Set());
    } catch (error) {
      console.error('Error submitting votes:', error);
      toast.error('Failed to submit your availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='w-full max-w-4xl mx-auto p-6'>
      <CardHeader>
        <CardTitle>Select Your Available Time Slots</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <Label>Select Day</Label>
            <Calendar
              mode='single'
              selected={date}
              onSelect={setDate}
              className='rounded-md border'
            />
          </div>

          <div className='space-y-4'>
            <Label>Your Time Zone</Label>
            <Select
              value={timeZone}
              onValueChange={setTimeZone}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select timezone' />
              </SelectTrigger>
              <SelectContent>
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <SelectItem
                    key={tz}
                    value={tz}
                  >
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='text-sm text-gray-500 mt-2'>
              <p>
                Times will be shown in your local timezone, but stored in UTC
              </p>
              <p>
                Current day in your timezone:{' '}
                {date ? DAYS_OF_WEEK[getDay(date)] : ''}
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6'>
          <h3 className='text-lg font-semibold mb-4'>
            Select Available Time Slots
          </h3>
          {loading ? (
            <div className='flex justify-center p-6'>
              <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full'></div>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2'>
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    onClick={() => toggleTimeSlot(slot)}
                    className={`
                      p-2 rounded border cursor-pointer transition-colors
                      ${
                        slot.selected
                          ? 'bg-primary/20 border-primary'
                          : slot.votes > 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className='text-sm font-medium'>
                      {format(slot.localTime, 'h:mm a')}
                    </div>
                    <div className='text-xs text-gray-500'>
                      UTC: {format(slot.utcTime, 'HH:mm')}
                      {slot.utcTime.getDay() !== slot.date.getDay() && (
                        <span className='ml-1'>
                          ({DAYS_OF_WEEK[slot.utcTime.getDay()].substring(0, 3)}
                          )
                        </span>
                      )}
                    </div>
                    {slot.votes > 0 && (
                      <div className='text-xs text-blue-500 mt-1'>
                        {slot.votes} {slot.votes === 1 ? 'vote' : 'votes'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className='mt-6'>
                <Button
                  onClick={submitVotes}
                  disabled={selectedSlots.size === 0 || loading}
                  className='w-full sm:w-auto'
                >
                  {loading ? (
                    <>
                      <span className='animate-spin mr-2'>⚙️</span>
                      Submitting...
                    </>
                  ) : (
                    `Submit ${selectedSlots.size} Time Slot${
                      selectedSlots.size !== 1 ? 's' : ''
                    }`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
