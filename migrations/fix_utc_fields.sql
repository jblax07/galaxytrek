-- Drop the existing functions to recreate them
DROP FUNCTION IF EXISTS increment_time_votes(JSON[]);
DROP FUNCTION IF EXISTS increment_vote(TEXT, INTEGER);

-- Recreate the increment_vote function with explicit params for UTC fields
CREATE OR REPLACE FUNCTION increment_vote(
  p_day TEXT, 
  p_hour INTEGER, 
  p_utc_hour INTEGER DEFAULT NULL, 
  p_utc_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE time_votes
  SET 
    vote_count = vote_count + 1,
    -- Only update UTC fields if they're provided and current values are NULL
    utc_hour = COALESCE(time_votes.utc_hour, p_utc_hour),
    utc_time = COALESCE(time_votes.utc_time, p_utc_time),
    updated_at = NOW()
  WHERE day = p_day AND hour = p_hour;
END;
$$;

-- Recreate the increment_time_votes function to handle the new fields
CREATE OR REPLACE FUNCTION increment_time_votes(vote_records JSON[])
RETURNS VOID 
LANGUAGE plpgsql
AS $$
DECLARE
  record JSON;
  v_day TEXT;
  v_hour INTEGER;
  v_utc_hour INTEGER;
  v_utc_time TIMESTAMPTZ;
  existing_record RECORD;
BEGIN
  FOREACH record IN ARRAY vote_records
  LOOP
    v_day := record->>'day';
    v_hour := (record->>'hour')::INTEGER;
    
    -- Explicitly parse the UTC fields with proper error handling
    BEGIN
      v_utc_hour := (record->>'utc_hour')::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      v_utc_hour := NULL;
    END;
    
    BEGIN
      v_utc_time := (record->>'utc_time')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
      v_utc_time := NULL;
    END;
    
    -- Log the values we're processing
    RAISE NOTICE 'Processing: day=%, hour=%, utc_hour=%, utc_time=%', 
      v_day, v_hour, v_utc_hour, v_utc_time;
    
    -- Check if record exists
    SELECT * INTO existing_record 
    FROM time_votes 
    WHERE day = v_day AND hour = v_hour;
    
    IF FOUND THEN
      -- Update existing record
      UPDATE time_votes 
      SET 
        vote_count = vote_count + 1,
        utc_hour = COALESCE(time_votes.utc_hour, v_utc_hour),
        utc_time = COALESCE(time_votes.utc_time, v_utc_time),
        updated_at = NOW()
      WHERE day = v_day AND hour = v_hour;
    ELSE
      -- Insert new record
      INSERT INTO time_votes (day, hour, vote_count, utc_hour, utc_time)
      VALUES (v_day, v_hour, 1, v_utc_hour, v_utc_time);
    END IF;
  END LOOP;
END;
$$;

-- Create a function to update all existing records with UTC information
CREATE OR REPLACE FUNCTION backfill_utc_times()
RETURNS INTEGER 
LANGUAGE plpgsql
AS $$
DECLARE
  record_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM time_votes WHERE utc_hour IS NULL OR utc_time IS NULL
  LOOP
    -- For each day and hour, calculate what the UTC time would be
    -- This is approximate since we don't know the original timezone
    -- We'll assume it was recorded in the server's timezone
    UPDATE time_votes
    SET 
      utc_hour = (r.hour + 0) % 24, -- Adjust for your server's offset from UTC
      utc_time = (NOW() AT TIME ZONE 'UTC')::DATE + make_interval(hours => r.hour)
    WHERE id = r.id;
    
    record_count := record_count + 1;
  END LOOP;
  
  RETURN record_count;
END;
$$; 