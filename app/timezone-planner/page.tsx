import { Metadata } from 'next';
import { TimeZoneScheduler } from '../components/TimeZoneScheduler';
import { PopularTimeSlots } from '../components/PopularTimeSlots';

export const metadata: Metadata = {
  title: 'Timezone Planner | GalaxyTrek',
  description: 'Find the best meeting times across different timezones',
};

export default function TimezonePlannerPage() {
  return (
    <div className='container mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold text-center mb-10'>Timezone Planner</h1>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
        <div className='lg:col-span-3'>
          <TimeZoneScheduler />
        </div>

        <div className='lg:col-span-2'>
          <PopularTimeSlots />
        </div>
      </div>

      <div className='mt-12 border-t pt-6 text-center text-sm text-gray-500'>
        <p>All times are stored in UTC and displayed in your local timezone.</p>
        <p>
          Click on time slots to select your availability and help find the best
          meeting time for everyone.
        </p>
      </div>
    </div>
  );
}
