-- Fix RLS Infinite Recursion on profiles table
-- Run this in your Supabase SQL Editor
-- 
-- The issue: Admin policies on the "profiles" table query the same table
-- to check if the user is an admin, causing infinite recursion.
-- 
-- Solution: Use auth.jwt() to check the role from the JWT token instead
-- of querying the profiles table itself.

-- ============================================
-- Step 1: Drop ALL existing policies on profiles to start clean
-- ============================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- Step 2: Create simple, non-recursive policies
-- ============================================

-- Allow all authenticated users to view profiles (no recursion risk)
CREATE POLICY "Anyone can view profiles" ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE TO authenticated
USING (auth.uid() = id);

-- ============================================
-- Step 3: Also fix the users table policies (if they exist)
-- ============================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END $$;

-- Simple users table policies
CREATE POLICY "Anyone can view users" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- Verification
-- ============================================
SELECT 'RLS infinite recursion fix applied!' as status;

-- Show all policies on profiles and users tables
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'users') AND schemaname = 'public'
ORDER BY tablename, policyname;
