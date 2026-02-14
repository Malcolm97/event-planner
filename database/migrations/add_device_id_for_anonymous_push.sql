-- Add device_id column for anonymous push subscriptions
-- Run this in your Supabase SQL Editor

-- Step 1: Add device_id column (nullable, allowing both user_id and device_id)
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Step 2: Create index on device_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_id 
ON public.push_subscriptions(device_id);

-- Step 3: Drop existing unique constraint on user_id and add new one that allows NULL
ALTER TABLE public.push_subscriptions 
DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;

-- Add new unique constraint that allows either user_id OR device_id to be set (but not both)
-- Note: We handle this at application level since PostgreSQL doesn't have great support for "one of these columns must be non-null"

-- Step 4: Create new RLS policies for anonymous subscriptions using device_id

-- Allow anyone to insert with device_id (anonymous)
CREATE POLICY "Anonymous users can insert subscriptions with device_id" 
ON public.push_subscriptions
FOR INSERT 
WITH CHECK (
    device_id IS NOT NULL 
    AND user_id IS NULL
);

-- Allow anyone to update their own subscription by device_id
CREATE POLICY "Anonymous users can update their own subscriptions by device_id" 
ON public.push_subscriptions
FOR UPDATE 
USING (device_id IS NOT NULL AND user_id IS NULL);

-- Allow anyone to delete their own subscription by device_id
CREATE POLICY "Anonymous users can delete their own subscriptions by device_id" 
ON public.push_subscriptions
FOR DELETE 
USING (device_id IS NOT NULL AND user_id IS NULL);

-- Allow anyone to select subscriptions (needed for sending notifications)
CREATE POLICY "Anyone can select all subscriptions" 
ON public.push_subscriptions
FOR SELECT 
USING (true);

-- Add comment
COMMENT ON COLUMN public.push_subscriptions.device_id IS 'Unique device identifier for anonymous push notification subscriptions';
