-- Comprehensive Backend Fix Migration
-- Run this in your Supabase SQL Editor to fix all backend issues
-- This script addresses: missing columns, RLS policies, table creation, and performance indexes

-- =====================================================
-- PART 1: PROFILES TABLE - Add Missing Columns
-- =====================================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS contact_method TEXT DEFAULT 'email' CHECK (contact_method IN ('email', 'phone', 'both', 'none')),
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS contact_visibility BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT false;

-- Create index for profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Sync email from auth.users to profiles (one-time migration)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- =====================================================
-- PART 2: EVENTS TABLE - Add Missing Columns
-- =====================================================

-- Add missing columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for events table performance
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_approved ON public.events(approved);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- =====================================================
-- PART 3: ACTIVITIES TABLE - Create if not exists
-- =====================================================

-- Create activities table for tracking user activities
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('event_created', 'event_updated', 'event_saved', 'event_completed', 'profile_updated', 'event_viewed')),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    event_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON public.activities(event_id);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 4: AUDIT LOGS TABLE - Create if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================================================
-- PART 5: CATEGORIES TABLE - Create if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Insert default categories if table is empty
INSERT INTO public.categories (name, description)
SELECT * FROM (
  VALUES
    ('Music', 'Concerts, festivals, and musical performances'),
    ('Sports', 'Sporting events and competitions'),
    ('Arts', 'Art exhibitions, theater, and cultural events'),
    ('Food & Drink', 'Food festivals, wine tastings, and culinary events'),
    ('Business', 'Conferences, networking, and business events'),
    ('Community', 'Community gatherings and local events'),
    ('Education', 'Workshops, classes, and educational events'),
    ('Entertainment', 'Comedy, shows, and entertainment events')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = v.name);

-- =====================================================
-- PART 6: LOCATIONS TABLE - Create if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 7: SAVED_EVENTS TABLE - Ensure exists
-- =====================================================

CREATE TABLE IF NOT EXISTS public.saved_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON public.saved_events(event_id);

-- =====================================================
-- PART 8: PUSH_SUBSCRIPTIONS TABLE - Ensure exists
-- =====================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint TEXT,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$
BEGIN
  -- Add endpoint column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'push_subscriptions' 
                 AND column_name = 'endpoint' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.push_subscriptions ADD COLUMN endpoint TEXT;
  END IF;
  
  -- Add device_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'push_subscriptions' 
                 AND column_name = 'device_id' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.push_subscriptions ADD COLUMN device_id TEXT;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'push_subscriptions' 
                 AND column_name = 'updated_at' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.push_subscriptions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create indexes safely (only on columns that are guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Create endpoint index only if the column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'push_subscriptions' 
             AND column_name = 'endpoint' 
             AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
  END IF;
END $$;

-- =====================================================
-- PART 9: RLS POLICIES - Drop and Recreate (Fix Infinite Recursion)
-- =====================================================

-- First, drop all existing policies to avoid conflicts
DO $$
DECLARE
    pol record;
BEGIN
    -- Drop policies from profiles
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
    
    -- Drop policies from events
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'events' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', pol.policyname);
    END LOOP;
    
    -- Drop policies from activities
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'activities' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.activities', pol.policyname);
    END LOOP;
    
    -- Drop policies from audit_logs
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'audit_logs' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_logs', pol.policyname);
    END LOOP;
    
    -- Drop policies from saved_events
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'saved_events' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.saved_events', pol.policyname);
    END LOOP;
    
    -- Drop policies from categories
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'categories' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.categories', pol.policyname);
    END LOOP;
    
    -- Drop policies from locations
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'locations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.locations', pol.policyname);
    END LOOP;
    
    -- Drop policies from push_subscriptions
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'push_subscriptions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.push_subscriptions', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- PART 10: RLS POLICIES - Create New Policies
-- =====================================================

-- Create helper function to check admin status (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (is_admin());

-- EVENTS POLICIES
-- Events are viewable by everyone (public)
CREATE POLICY "Events are viewable by everyone" ON public.events
FOR SELECT USING (true);

-- Users can create events
CREATE POLICY "Users can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Users can update their own events
CREATE POLICY "Users can update own events" ON public.events
FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

-- Users can delete their own events
CREATE POLICY "Users can delete own events" ON public.events
FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Admins can update any event
CREATE POLICY "Admins can update any event" ON public.events
FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admins can delete any event
CREATE POLICY "Admins can delete any event" ON public.events
FOR DELETE TO authenticated
USING (is_admin());

-- ACTIVITIES POLICIES
-- Users can view their own activities
CREATE POLICY "Users can view own activities" ON public.activities
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own activities
CREATE POLICY "Users can insert own activities" ON public.activities
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all activities
CREATE POLICY "Admins can view all activities" ON public.activities
FOR SELECT TO authenticated
USING (is_admin());

-- Admins can manage all activities
CREATE POLICY "Admins can manage all activities" ON public.activities
FOR ALL TO authenticated
USING (is_admin());

-- AUDIT LOGS POLICIES
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (is_admin());

-- Allow inserts for authenticated users (for logging)
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- SAVED_EVENTS POLICIES
-- Users can view their own saved events
CREATE POLICY "Users can view own saved events" ON public.saved_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can save events
CREATE POLICY "Users can save events" ON public.saved_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can unsave events
CREATE POLICY "Users can unsave events" ON public.saved_events
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all saved events
CREATE POLICY "Admins can view all saved events" ON public.saved_events
FOR SELECT TO authenticated
USING (is_admin());

-- CATEGORIES POLICIES
-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone" ON public.categories
FOR SELECT USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- LOCATIONS POLICIES
-- Locations are viewable by everyone
CREATE POLICY "Locations are viewable by everyone" ON public.locations
FOR SELECT USING (true);

-- Admins can manage locations
CREATE POLICY "Admins can manage locations" ON public.locations
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- PUSH_SUBSCRIPTIONS POLICIES
-- Users can view their own subscriptions
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all push subscriptions
CREATE POLICY "Admins can view all push subscriptions" ON public.push_subscriptions
FOR SELECT TO authenticated
USING (is_admin());

-- =====================================================
-- PART 11: SET ADMIN USERS
-- =====================================================

-- Update specific users to have admin role
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('test@test.com', 'sionimalcolm@gmail.com')
);

-- =====================================================
-- PART 12: VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'events', 'activities', 'audit_logs', 'saved_events', 'categories', 'locations', 'push_subscriptions')
ORDER BY table_name;

-- Verify admin users
SELECT
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.role = 'admin';

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'events', 'activities', 'audit_logs', 'saved_events', 'categories', 'locations', 'push_subscriptions');

-- Count records in each table
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'events', COUNT(*) FROM public.events
UNION ALL
SELECT 'activities', COUNT(*) FROM public.activities
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM public.audit_logs
UNION ALL
SELECT 'saved_events', COUNT(*) FROM public.saved_events
UNION ALL
SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL
SELECT 'locations', COUNT(*) FROM public.locations
UNION ALL
SELECT 'push_subscriptions', COUNT(*) FROM public.push_subscriptions;