import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Add warning about missing service role key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not defined. Falling back to public anon key which may limit functionality.'
  );
}

interface TimeVote {
  day: string;
  hour: number;
  utc_hour?: number;
  utc_time?: string;
  local_day?: string;
  local_hour?: number;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('time_votes')
      .select('*')
      .order('day', { ascending: true })
      .order('hour', { ascending: true });

    if (error) {
      console.error('Error fetching time votes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time votes' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { votes } = body;

    if (!votes || !Array.isArray(votes)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    console.log('Received votes data:', JSON.stringify(votes, null, 2));

    // Begin a transaction to update all votes atomically
    const { error } = await supabase.rpc('increment_time_votes', {
      vote_records: votes,
    });

    if (error) {
      console.error('Error updating time votes:', error);

      // Fall back to individual upserts if the RPC fails
      for (const vote of votes as TimeVote[]) {
        // Validate vote data
        if (!vote.day || vote.hour === undefined) {
          console.error('Invalid vote data', vote);
          continue;
        }

        // Log each vote being processed
        console.log('Processing vote:', {
          day: vote.day,
          hour: vote.hour,
          utc_hour: vote.utc_hour,
          utc_time: vote.utc_time,
        });

        // Perform upsert - insert if not exists, increment if exists
        const { error: upsertError, data } = await supabase
          .from('time_votes')
          .upsert(
            {
              day: vote.day,
              hour: vote.hour,
              vote_count: 1, // Start with 1 for new records
              utc_hour: vote.utc_hour,
              utc_time: vote.utc_time,
              local_day: vote.local_day,
              local_hour: vote.local_hour,
            },
            {
              onConflict: 'day,hour',
              // This is a workaround since supabase-js doesn't directly support
              // "vote_count = time_votes.vote_count + 1" in the update clause
              ignoreDuplicates: false,
            }
          );

        console.log('Upsert result:', data);

        // We need a separate update for existing records to increment
        const { error: rpcError, data: rpcData } = await supabase.rpc(
          'increment_vote',
          {
            p_day: vote.day,
            p_hour: vote.hour,
            p_utc_hour: vote.utc_hour,
            p_utc_time: vote.utc_time,
          }
        );

        console.log('RPC increment result:', rpcData);

        if (upsertError || rpcError) {
          console.error('Error upserting time vote:', upsertError || rpcError);
          return NextResponse.json(
            { error: 'Failed to record votes' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
