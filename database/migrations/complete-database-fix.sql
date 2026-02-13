-- ============================================
-- Complete Database Fix - All Tables, Columns & RLS Policies
-- Run this in your Supabase SQL Editor to fix all database issues
-- ============================================

-- ============================================
-- PART 1: Create/Fix USERS Table (aliased from profiles)
-- ============================================

-- Create users table if not exists (matches code expectations)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    about TEXT,
    photo_url TEXT,
    contact_method TEXT DEFAULT 'both',
    whatsapp_number TEXT,
    contact_visibility BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own user" ON public.users;
DROP POLICY IF EXISTS "Users can update own user" ON public.users;
DROP POLICY IF EXISTS "Users can delete own user" ON public.users;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON public.users
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can insert own user" ON public.users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own user" ON public.users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own user" ON public.users
FOR DELETE TO authenticated
USING (auth.uid() = id);

-- ============================================
-- PART 2: Fix EVENTS Table
-- ============================================

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add venue column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'venue') THEN
        ALTER TABLE public.events ADD COLUMN venue TEXT;
    END IF;
    
    -- Add end_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'end_date') THEN
        ALTER TABLE public.events ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add location_description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_description') THEN
        ALTER TABLE public.events ADD COLUMN location_description TEXT;
    END IF;
END $$;

-- Fix RLS policies for events
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Events are viewable by everyone" ON public.events
FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own events" ON public.events
FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON public.events
FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- ============================================
-- PART 3: Fix SAVED_EVENTS Table
-- ============================================

-- Create saved_events table if not exists
CREATE TABLE IF NOT EXISTS public.saved_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own saved events" ON public.saved_events;
DROP POLICY IF EXISTS "Users can save events" ON public.saved_events;
DROP POLICY IF EXISTS "Users can unsave events" ON public.saved_events;

-- RLS Policies for saved_events
CREATE POLICY "Users can view their own saved events" ON public.saved_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can save events" ON public.saved_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave events" ON public.saved_events
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- PART 4: Create ACTIVITIES Table
-- ============================================

-- Create activities table if not exists
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    event_id TEXT,
    event_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.activities
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON public.activities
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON public.activities
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- PART 5: Create PUSH_SUBSCRIPTIONS Table
-- ============================================

-- Create push_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service can view all push subscriptions" ON public.push_subscriptions;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert push subscriptions" ON public.push_subscriptions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Service role can view all (for sending notifications)
CREATE POLICY "Service can view all push subscriptions" ON public.push_subscriptions
FOR SELECT TO service_role
USING (true);

-- ============================================
-- PART 6: Create INDEXES for Performance
-- ============================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- Saved events indexes
CREATE INDEX IF NOT EXISTS idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON public.saved_events(event_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON public.activities(event_id);

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================
-- PART 7: Verification Queries
-- ============================================

SELECT '✅ Database setup complete!' as status;

-- Show all tables
SELECT 
    table_name,
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show all columns in events table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
