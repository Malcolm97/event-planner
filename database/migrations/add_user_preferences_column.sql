-- Migration: Add preferences column to users table
-- Run this in your Supabase SQL Editor
-- Fixes: "Failed to load user preferences: {}" error in settings page

-- Add preferences column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.preferences IS 'JSON string containing user preferences like autoSync and landing page';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'preferences';
