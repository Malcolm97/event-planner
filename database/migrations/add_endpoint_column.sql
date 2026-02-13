-- Add endpoint column to push_subscriptions table if it doesn't exist
-- This migration fixes the missing endpoint column issue

-- Check if endpoint column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_subscriptions' 
        AND column_name = 'endpoint'
    ) THEN
        ALTER TABLE push_subscriptions ADD COLUMN endpoint TEXT;
        COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push subscription endpoint URL';
    END IF;
END $$;

-- Also ensure there's a unique constraint on user_id (only one subscription per user)
-- Drop existing unique constraint if it exists with different columns
DO $$
BEGIN
    -- Try to drop constraint if it exists with wrong columns
    ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Add unique constraint on user_id
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_unique UNIQUE (user_id);

-- Create index on endpoint for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
