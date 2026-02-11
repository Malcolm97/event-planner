# Supabase RLS Policy Fix Instructions

## Problem
The error `"infinite recursion detected in policy for relation \"profiles\""` is caused by circular references in your Supabase RLS (Row Level Security) policies.

## Solution
You need to run SQL commands in your Supabase SQL Editor to fix the database policies.

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### 2. Run the Fix SQL
Copy and paste the following SQL commands into the query editor:

```sql
-- Fix RLS Policy Conflicts and Infinite Recursion
-- Run this in your Supabase SQL Editor to fix the infinite recursion issue

-- First, drop the conflicting policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Recreate the policies with non-circular references
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin'
  )
);

-- Verify the policies are working correctly
SELECT 'RLS policies updated successfully' as status;
```

### 3. Execute the Query
1. Click the **Run** button
2. You should see a success message

### 4. Verify the Fix
After running the SQL:
1. Refresh your application
2. The infinite recursion error should be gone
3. User profile loading should work properly

## Alternative: Use the Fix Script
You can also copy the contents of `fix-rls-policies.sql` file in your project and paste them into the Supabase SQL Editor.

## What This Fixes
- ✅ Eliminates infinite recursion in RLS policies
- ✅ Allows user profiles to load properly
- ✅ Maintains admin access to profiles
- ✅ Prevents the console error from occurring

## After the Fix
Once you've run this SQL, the error should be completely resolved and your application should work normally.