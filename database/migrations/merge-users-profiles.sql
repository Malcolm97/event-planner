-- Merge Users and Profiles Tables
-- Run this in your Supabase SQL Editor
-- This script ensures all users are in the profiles table and removes duplicates

-- ============================================
-- PART 1: Ensure profiles table has all required columns
-- ============================================

-- Add missing columns to profiles table if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_method TEXT DEFAULT 'both',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS contact_visibility BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true;

-- ============================================
-- PART 2: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- ============================================
-- PART 3: Sync email from auth.users to profiles
-- ============================================

-- Update profiles with email from auth.users where missing
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- ============================================
-- PART 4: Merge data from users table if it exists
-- ============================================

-- Check if users table exists and merge data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Merge users table data into profiles
        -- Insert users that don't exist in profiles
        INSERT INTO public.profiles (id, full_name, avatar_url, email, phone, company, about, updated_at)
        SELECT 
            u.id,
            COALESCE(u.name, u.email),
            u.photo_url,
            u.email,
            u.phone,
            u.company,
            u.about,
            COALESCE(u.updated_at, now())
        FROM public.users u
        WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
        ON CONFLICT (id) DO NOTHING;
        
        -- Update existing profiles with missing data from users
        UPDATE public.profiles p
        SET 
            full_name = COALESCE(p.full_name, u.name),
            avatar_url = COALESCE(p.avatar_url, u.photo_url),
            phone = COALESCE(p.phone, u.phone),
            company = COALESCE(p.company, u.company),
            about = COALESCE(p.about, u.about)
        FROM public.users u
        WHERE p.id = u.id;
        
        RAISE NOTICE 'Merged data from users table into profiles';
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping merge';
    END IF;
END $$;

-- ============================================
-- PART 5: Create profiles for auth.users without profiles
-- ============================================

-- Insert profiles for all auth.users that don't have one
INSERT INTO public.profiles (id, full_name, email, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    u.email,
    now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 6: Remove duplicate profiles (keep most recent)
-- ============================================

-- Remove duplicates based on email (keep the one with most recent updated_at)
DELETE FROM public.profiles p
WHERE EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.email = p.email
    AND p2.email IS NOT NULL
    AND p2.email != ''
    AND p2.updated_at > p.updated_at
);

-- ============================================
-- PART 7: Fix RLS Policies for profiles table
-- ============================================

-- Drop existing policies (include all possible policy names)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create the is_admin function if it doesn't exist
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

-- Policy 1: Allow public read access to all profiles (needed for creators page, admin, etc.)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT
USING (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy 5: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (is_admin());

-- ============================================
-- PART 8: Verification queries
-- ============================================

-- Show counts
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles;

-- Show any users missing from profiles
SELECT u.id, u.email, 'Missing from profiles' as issue
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Show profile details
SELECT id, full_name, email, role, approved, updated_at
FROM public.profiles
ORDER BY updated_at DESC;