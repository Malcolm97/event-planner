-- Database Migration: Add image_url and image_urls columns to events table
-- Run this in your Supabase SQL Editor

-- Add the image_url column for backward compatibility
ALTER TABLE events ADD COLUMN image_url TEXT;

-- Add the image_urls column to support multiple images
ALTER TABLE events ADD COLUMN image_urls TEXT[];

-- Optional: Create an index for better query performance
CREATE INDEX idx_events_image_urls ON events USING GIN (image_urls);

-- Optional: Add a comment to document the columns
COMMENT ON COLUMN events.image_url IS 'Single image URL for backward compatibility';
COMMENT ON COLUMN events.image_urls IS 'Array of image URLs for multiple event photos (up to 3)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' AND column_name IN ('image_url', 'image_urls');
