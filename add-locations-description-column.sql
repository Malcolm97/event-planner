-- Add description column to locations table
-- Run this in your Supabase SQL Editor

-- Add the missing description column to locations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'locations' AND column_name = 'description') THEN
        ALTER TABLE public.locations ADD COLUMN description text;
        RAISE NOTICE 'Added description column to locations table';
    ELSE
        RAISE NOTICE 'Description column already exists in locations table';
    END IF;
END $$;

-- Update existing locations to have default descriptions if they don't have one
UPDATE public.locations
SET description = 'Location in Papua New Guinea'
WHERE description IS NULL OR description = '';

-- Verify the column was added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;
