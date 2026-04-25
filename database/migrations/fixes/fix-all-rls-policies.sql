-- Fix All RLS Policies - Add TO authenticated clause
-- Run this in your Supabase SQL Editor to fix all RLS policy issues

-- ============================================
-- Fix saved_events table policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own saved events" ON public.saved_events;
DROP POLICY IF EXISTS "Users can save events" ON public.saved_events;
DROP POLICY IF EXISTS "Users can unsave events" ON public.saved_events;

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
-- Fix activities table policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

CREATE POLICY "Users can view their own activities" ON public.activities
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.activities
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON public.activities
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON public.activities
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- Fix events table policies (if needed)
-- ============================================
-- Note: The SELECT policy for events allows public access, which is correct
-- But INSERT/UPDATE/DELETE policies should have TO authenticated

DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Users can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own events" ON public.events
FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON public.events
FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- ============================================
-- Fix profiles table policies (if needed)
-- ============================================
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- Verification
-- ============================================
SELECT 'All RLS policies have been fixed successfully!' as status;

-- Show current policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('saved_events', 'activities', 'events', 'profiles')
ORDER BY tablename, policyname;