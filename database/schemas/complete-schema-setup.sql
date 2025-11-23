-- Complete Supabase Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    category TEXT,
    location TEXT NOT NULL,
    venue TEXT,
    presale_price DECIMAL,
    gate_price DECIMAL,
    description TEXT NOT NULL,
    image_urls TEXT[],
    featured BOOLEAN DEFAULT false,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Events policies: Allow anyone to read events, authenticated users can create/update their own
CREATE POLICY "Events are viewable by everyone" ON public.events
FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON public.events
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own events" ON public.events
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON public.events
FOR DELETE USING (auth.uid() = created_by);

-- Profiles policy: Users can manage their own profile
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add venue column to events table (if not exists) - using DO block for safety
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'events' AND column_name = 'venue') THEN
        ALTER TABLE public.events ADD COLUMN venue TEXT;
    END IF;
END $$;

-- Create saved_events table for user bookmarks
CREATE TABLE IF NOT EXISTS public.saved_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on saved_events
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved events
CREATE POLICY "Users can view their own saved events" ON public.saved_events
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved events
CREATE POLICY "Users can save events" ON public.saved_events
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved events
CREATE POLICY "Users can unsave events" ON public.saved_events
FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON public.saved_events(event_id);
