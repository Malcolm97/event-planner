-- Fix for creators/users public access
-- Run this in your Supabase SQL Editor to ensure public read access to users table

-- Drop existing SELECT policy if it exists and might be too restrictive
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Create a more explicit public read policy
CREATE POLICY "Public can view user profiles" ON public.users
FOR SELECT
USING (true);

-- Verify the policies are in place
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';
