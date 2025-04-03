-- Create function to increment a single vote
CREATE OR REPLACE FUNCTION increment_vote(p_day TEXT, p_hour INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert if not exists, otherwise increment vote_count
  INSERT INTO public.time_votes (day, hour, vote_count)
  VALUES (p_day, p_hour, 1)
  ON CONFLICT (day, hour) 
  DO UPDATE SET 
    vote_count = time_votes.vote_count + 1,
    updated_at = timezone('utc'::text, now());
END;
$$;

-- Create function to handle bulk vote increments
CREATE OR REPLACE FUNCTION increment_time_votes(vote_records json)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vote_record json;
BEGIN
  FOR vote_record IN SELECT * FROM json_array_elements(vote_records)
  LOOP
    -- Extract day and hour from the JSON
    PERFORM increment_vote(
      (vote_record->>'day')::TEXT,
      (vote_record->>'hour')::INTEGER
    );
  END LOOP;
END;
$$; 