-- Add UTC time fields to the time_votes table
ALTER TABLE time_votes 
ADD COLUMN IF NOT EXISTS utc_hour INTEGER,
ADD COLUMN IF NOT EXISTS utc_time TIMESTAMPTZ;

-- Update the increment_vote RPC function to preserve these fields
CREATE OR REPLACE FUNCTION increment_vote(p_day TEXT, p_hour INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE time_votes
  SET vote_count = vote_count + 1
  WHERE day = p_day AND hour = p_hour;
END;
$$ LANGUAGE plpgsql;

-- Update the increment_time_votes RPC function to handle the new fields
CREATE OR REPLACE FUNCTION increment_time_votes(vote_records JSON[])
RETURNS VOID AS $$
DECLARE
  record JSON;
  v_day TEXT;
  v_hour INTEGER;
  v_utc_hour INTEGER;
  v_utc_time TIMESTAMPTZ;
BEGIN
  FOREACH record IN ARRAY vote_records
  LOOP
    v_day := record->>'day';
    v_hour := (record->>'hour')::INTEGER;
    v_utc_hour := (record->>'utc_hour')::INTEGER;
    v_utc_time := (record->>'utc_time')::TIMESTAMPTZ;
    
    -- Upsert the vote record
    INSERT INTO time_votes (day, hour, vote_count, utc_hour, utc_time)
    VALUES (v_day, v_hour, 1, v_utc_hour, v_utc_time)
    ON CONFLICT (day, hour) 
    DO UPDATE SET 
      vote_count = time_votes.vote_count + 1,
      -- Only update UTC fields if they're not already set
      utc_hour = COALESCE(time_votes.utc_hour, EXCLUDED.utc_hour),
      utc_time = COALESCE(time_votes.utc_time, EXCLUDED.utc_time);
  END LOOP;
END;
$$ LANGUAGE plpgsql; 