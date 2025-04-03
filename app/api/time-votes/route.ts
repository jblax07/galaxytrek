import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Begin a transaction to update all votes atomically
    const { error } = await supabase.rpc('increment_time_votes', {
      vote_records: votes,
    });

    if (error) {
      console.error('Error updating time votes:', error);

      // Fall back to individual upserts if the RPC fails
      for (const vote of votes) {
        // Perform upsert - insert if not exists, increment if exists
        const { error: upsertError } = await supabase.from('time_votes').upsert(
          {
            day: vote.day,
            hour: vote.hour,
            vote_count: 1, // Start with 1 for new records
          },
          {
            onConflict: 'day,hour',
            // This is a workaround since supabase-js doesn't directly support
            // "vote_count = time_votes.vote_count + 1" in the update clause
            ignoreDuplicates: false,
          }
        );

        // We need a separate update for existing records to increment
        await supabase.rpc('increment_vote', {
          p_day: vote.day,
          p_hour: vote.hour,
        });

        if (upsertError) {
          console.error('Error upserting time vote:', upsertError);
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
