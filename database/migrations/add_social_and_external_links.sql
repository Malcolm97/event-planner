-- Migration: Add Social Links for Users and External Links for Events
-- Run this in your Supabase SQL Editor

-- ============================================
-- PART 1: Add Social Links to Users Table
-- ============================================

-- Add social_links column as JSONB to store social media URLs
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add show_social_links toggle (default true)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true;

-- Create index for social_links queries
CREATE INDEX IF NOT EXISTS idx_users_social_links ON public.users USING GIN (social_links);

-- Add comments for documentation
COMMENT ON COLUMN public.users.social_links IS 'JSON object storing social media URLs: {"facebook": "url", "instagram": "url", "tiktok": "url", "twitter": "url"}';
COMMENT ON COLUMN public.users.show_social_links IS 'Whether to display social links on public profile';

-- ============================================
-- PART 2: Add External Links to Events Table
-- ============================================

-- Add external_links column as JSONB to store external event posting URLs
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '{}'::jsonb;

-- Create index for external_links queries
CREATE INDEX IF NOT EXISTS idx_events_external_links ON public.events USING GIN (external_links);

-- Add comment for documentation
COMMENT ON COLUMN public.events.external_links IS 'JSON object storing external event URLs: {"facebook": "url", "instagram": "url", "tiktok": "url", "website": "url"}';

-- ============================================
-- PART 3: Update RLS Policies (if needed)
-- ============================================

-- Ensure policies allow reading these new columns (existing policies should cover this)
-- The existing policies already allow:
-- - Anyone to read events
-- - Users to create/update their own events
-- - Anyone to view users
-- - Users to update their own profile

-- No additional policy changes needed as these are just new columns
-- on existing tables with existing policies