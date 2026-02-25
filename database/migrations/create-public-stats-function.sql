-- Create Public Stats Function
-- Run this in your Supabase SQL Editor to create a function that returns public stats
-- This function uses SECURITY DEFINER to bypass RLS for count queries

-- Create a function to get public statistics
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users BIGINT;
  total_events BIGINT;
  cities_covered BIGINT;
BEGIN
  -- Get total users count
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  -- Get total events count
  SELECT COUNT(*) INTO total_events FROM public.events;
  
  -- Get unique cities count from events
  SELECT COUNT(DISTINCT SPLIT_PART(location, ',', 1)) INTO cities_covered
  FROM public.events
  WHERE location IS NOT NULL AND location != '';
  
  RETURN json_build_object(
    'totalUsers', total_users,
    'totalEvents', total_events,
    'citiesCovered', cities_covered
  );
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO authenticated;

-- Test the function
SELECT public.get_public_stats();