'use client';

import { useState, useEffect } from 'react';

export function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState({
    local: '',
    cst: '',
  });

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();

      // Format local time
      const localTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      // Convert to CST (UTC-6)
      const cstTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const formattedCST = cstTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago',
      });

      setCurrentTime({
        local: localTime,
        cst: formattedCST,
      });
    };

    // Update immediately and then every second
    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex items-center justify-center space-x-4 p-4 bg-gray-100 rounded-lg'>
      <div className='text-center'>
        <div className='text-sm text-gray-600'>Your Local Time</div>
        <div className='text-2xl font-bold'>{currentTime.local}</div>
      </div>
      <div className='text-center'>
        <div className='text-sm text-gray-600'>Central Time (CST)</div>
        <div className='text-2xl font-bold'>{currentTime.cst}</div>
      </div>
    </div>
  );
}
