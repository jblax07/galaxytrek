import { createClient } from '@supabase/supabase-js';
import { TimeVote } from './types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getVoteCounts(): Promise<TimeVote[]> {
  const { data, error } = await supabase.from('time_votes').select('*');

  if (error) {
    console.error('Error fetching vote counts:', error);
    return [];
  }

  return data || [];
}

export async function updateVoteCount(
  day: string,
  hour: number,
  increment: boolean
): Promise<void> {
  // First, try to update existing record
  const { data: existingVote } = await supabase
    .from('time_votes')
    .select('vote_count')
    .eq('day', day)
    .eq('hour', hour)
    .single();

  if (existingVote) {
    // Update existing vote count
    const newCount = increment
      ? existingVote.vote_count + 1
      : Math.max(0, existingVote.vote_count - 1);
    await supabase
      .from('time_votes')
      .update({ vote_count: newCount, updated_at: new Date().toISOString() })
      .eq('day', day)
      .eq('hour', hour);
  } else if (increment) {
    // Insert new record with count 1
    await supabase.from('time_votes').insert({
      day,
      hour,
      vote_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
