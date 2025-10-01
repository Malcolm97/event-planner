-- Database Migration: Add end_date column to events table
-- Run this in your Supabase SQL Editor

-- Add the end_date column to support optional end date/time for events
ALTER TABLE events ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- Optional: Create an index for better query performance on end_date
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN events.end_date IS 'Optional end date and time for the event';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'end_date';
