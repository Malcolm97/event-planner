-- Fix Profiles Public Read Access
-- Run this in your Supabase SQL Editor to allow public read access to profiles
-- This is needed for the creators page and profile pages to work

-- First, check if the is_admin() function exists, if not create it
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

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create new policies for profiles table

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow public read access to all profiles (for creators page)
-- This allows anyone to view profile data which is needed for the creators page
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT
USING (true);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 5: Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy 6: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (is_admin());

-- Verify the policies are in place
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
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';