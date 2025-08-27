-- Database Migration: Add image_urls column to events table
-- Run this in your Supabase SQL Editor

-- Add the image_urls column to support multiple images
ALTER TABLE events ADD COLUMN image_urls TEXT[];

-- Optional: Create an index for better query performance
CREATE INDEX idx_events_image_urls ON events USING GIN (image_urls);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN events.image_urls IS 'Array of image URLs for multiple event photos (up to 3)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'image_urls';
