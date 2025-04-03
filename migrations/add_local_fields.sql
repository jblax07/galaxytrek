-- Add local time fields to the time_votes table
ALTER TABLE time_votes 
ADD COLUMN IF NOT EXISTS local_day TEXT,
ADD COLUMN IF NOT EXISTS local_hour INTEGER; 