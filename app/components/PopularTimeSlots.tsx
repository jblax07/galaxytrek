'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TimeVote {
  id: string;
  day: string;
  hour: number;
  vote_count: number;
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

export function PopularTimeSlots() {
  const [timeVotes, setTimeVotes] = useState<TimeVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  useEffect(() => {
    const fetchTimeVotes = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/time-votes');
        if (!response.ok) {
          throw new Error('Failed to fetch time votes');
        }
        const data = await response.json();
        setTimeVotes(data);
      } catch (error) {
        console.error('Error fetching time votes:', error);
        setError('Failed to load popular time slots');
        toast.error('Failed to load popular time slots');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeVotes();
  }, []);

  // Group votes by day
  const votesByDay = timeVotes.reduce((acc, vote) => {
    if (!acc[vote.day]) {
      acc[vote.day] = [];
    }
    acc[vote.day].push(vote);
    return acc;
  }, {} as Record<string, TimeVote[]>);

  const formatHour = (hour: number) => {
    // Create a date object for the current day at the specified hour
    const date = new Date();
    date.setHours(hour, 0, 0, 0);

    // Format the time based on the user's locale
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone,
    }).format(date);
  };

  const sortedDays = Object.keys(votesByDay).sort((a, b) => {
    // Sort days of week in calendar order
    return DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b);
  });

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Popular Time Slots</CardTitle>
        <div className='mt-2'>
          <Label>Time Zone</Label>
          <Select
            value={timeZone}
            onValueChange={setTimeZone}
          >
            <SelectTrigger className='w-full md:w-[260px]'>
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
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='flex justify-center p-6'>
            <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full'></div>
          </div>
        ) : error ? (
          <div className='text-red-500 text-center p-4'>{error}</div>
        ) : timeVotes.length === 0 ? (
          <div className='text-center p-4 text-gray-500'>
            No time slots have been voted on yet.
          </div>
        ) : (
          <div className='space-y-6'>
            {sortedDays.map((day) => (
              <div
                key={day}
                className='space-y-2'
              >
                <h3 className='font-medium text-lg'>{day}</h3>
                <div className='flex flex-wrap gap-2'>
                  {votesByDay[day]
                    .sort((a, b) => {
                      // Sort by vote count (descending), then by hour (ascending)
                      if (b.vote_count !== a.vote_count) {
                        return b.vote_count - a.vote_count;
                      }
                      return a.hour - b.hour;
                    })
                    .map((vote) => (
                      <Badge
                        key={vote.id}
                        variant={vote.vote_count > 2 ? 'default' : 'outline'}
                        className='px-3 py-1'
                      >
                        {formatHour(vote.hour)} ({vote.vote_count})
                      </Badge>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
