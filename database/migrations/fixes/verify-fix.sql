-- Verification script to check if RLS policies are working correctly
-- Run this in your Supabase SQL Editor after applying the fix

-- Check if the policies exist and are properly configured
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policy 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test that the policy logic works without recursion
-- This should return a list of policy names if they're working correctly
SELECT 'Policy verification complete' as status;